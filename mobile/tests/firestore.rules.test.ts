import fs from 'node:fs';
import path from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setLogLevel,
  setDoc,
  Timestamp,
  type Firestore,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { FirebaseWorkoutPlanRepository } from '../src/features/workout-plans/infrastructure/firestore/firebase-workout-plan.repository';

const PROJECT_ID = 'demo-app-treino';
const PRIMARY_USER_ID = 'qa_primary_user';
const SECONDARY_USER_ID = 'qa_secondary_user';

const validConfig = {
  Divisao: 'Push',
  Exercicio: 'Supino Reto',
  Series_Padrao: 3,
  Ordem: 1,
};

const validHistory = {
  Data: '2026-07-01',
  Treino: 'Push',
  Exercício: 'Supino Reto',
  Série: 1,
  Carga: 60,
  Reps: 10,
  RPE: 8,
  Obs: '',
};

const validWeight = {
  Data: '2026-07-01',
  Peso: 79.6,
};

let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel('silent');
  const rulesPath = path.resolve(__dirname, '../../firebase/firestore.rules');

  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(rulesPath, 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe('Firestore ownership rules', () => {
  it('allows the owner to create, read, update and delete a valid document', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const reference = doc(
      database,
      `usuarios/${PRIMARY_USER_ID}/config_treinos/config-1`,
    );

    await assertSucceeds(setDoc(reference, validConfig));
    await assertSucceeds(getDoc(reference));
    await assertSucceeds(updateDoc(reference, { Ordem: 2 }));
    await assertSucceeds(deleteDoc(reference));
  });

  it('denies reads and writes from another authenticated user', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `usuarios/${PRIMARY_USER_ID}/config_treinos/private-config`,
        ),
        validConfig,
      );
    });

    const intruderDatabase = testEnvironment
      .authenticatedContext(SECONDARY_USER_ID)
      .firestore();
    const privateReference = doc(
      intruderDatabase,
      `usuarios/${PRIMARY_USER_ID}/config_treinos/private-config`,
    );

    await assertFails(getDoc(privateReference));
    await assertFails(setDoc(privateReference, validConfig));
  });

  it('denies anonymous access', async () => {
    const database = testEnvironment.unauthenticatedContext().firestore();
    const reference = doc(
      database,
      `usuarios/${PRIMARY_USER_ID}/historico_pesos/2026-07-01`,
    );

    await assertFails(getDoc(reference));
    await assertFails(setDoc(reference, validWeight));
  });

  it('denies undeclared collections and the user parent document', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();

    await assertFails(
      setDoc(doc(database, `usuarios/${PRIMARY_USER_ID}`), { admin: true }),
    );
    await assertFails(
      setDoc(doc(database, `usuarios/${PRIMARY_USER_ID}/segredos/secret-1`), {
        value: 'denied',
      }),
    );
  });
});

describe('config_treinos validation', () => {
  it('accepts legacy and versioned config documents', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();

    await assertSucceeds(
      setDoc(doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/legacy`), {
        Divisao: 'Push',
        Exercicio: 'Tríceps Corda',
        Series_Padrao: 3,
      }),
    );
    await assertSucceeds(
      setDoc(doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/versioned`), {
        ...validConfig,
        schemaVersion: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
    );
  });

  it.each([
    { ...validConfig, Series_Padrao: 0 },
    { ...validConfig, Ordem: 1.5 },
    { ...validConfig, fieldNotAllowed: true },
    { ...validConfig, schemaVersion: 2 },
  ])('rejects an invalid config document', async (invalidConfig) => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();

    await assertFails(
      setDoc(
        doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/invalid`),
        invalidConfig,
      ),
    );
  });
});

describe('workout plan repository integration', () => {
  it('reads legacy data and completes CRUD using the document ID', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWorkoutPlanRepository(
      database as unknown as Firestore,
    );

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `usuarios/${PRIMARY_USER_ID}/config_treinos/legacy-without-order`,
        ),
        {
          Divisao: 'Push',
          Exercicio: 'Tríceps Corda',
          Series_Padrao: 3,
        },
      );
    });

    await expect(repository.list(PRIMARY_USER_ID)).resolves.toEqual([
      expect.objectContaining({ id: 'legacy-without-order', order: 99 }),
    ]);

    const createdId = await repository.create(PRIMARY_USER_ID, {
      division: 'Pull',
      name: 'Rosca Direta',
      defaultSets: 4,
      order: 1,
    });
    await repository.update(PRIMARY_USER_ID, createdId, {
      division: 'Pull B',
      name: 'Rosca Direta',
      defaultSets: 3,
      order: 2,
    });

    expect(
      (
        await getDoc(
          doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/${createdId}`),
        )
      ).data(),
    ).toMatchObject({
      Divisao: 'Pull B',
      Exercicio: 'Rosca Direta',
      Series_Padrao: 3,
      Ordem: 2,
      schemaVersion: 1,
      createdAt: expect.any(Timestamp),
      updatedAt: expect.any(Timestamp),
    });

    await repository.delete(PRIMARY_USER_ID, createdId);
    expect(
      (
        await getDoc(
          doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/${createdId}`),
        )
      ).exists(),
    ).toBe(false);
    expect(
      (
        await getDoc(
          doc(
            database,
            `usuarios/${PRIMARY_USER_ID}/config_treinos/legacy-without-order`,
          ),
        )
      ).exists(),
    ).toBe(true);
  });

  it('reorders multiple exercises atomically', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWorkoutPlanRepository(
      database as unknown as Firestore,
    );
    const first = doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/first`);
    const second = doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/second`);
    await setDoc(first, validConfig);
    await setDoc(second, { ...validConfig, Exercicio: 'Crucifixo', Ordem: 2 });

    await repository.updateOrder(PRIMARY_USER_ID, [
      { id: 'first', order: 2 },
      { id: 'second', order: 1 },
    ]);

    expect((await getDoc(first)).data()?.Ordem).toBe(2);
    expect((await getDoc(second)).data()?.Ordem).toBe(1);
  });
});

describe('historico_treinos validation', () => {
  it('accepts a legacy record and a versioned record', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();

    await assertSucceeds(
      setDoc(
        doc(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos/legacy`),
        validHistory,
      ),
    );
    await assertSucceeds(
      setDoc(doc(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos/versioned`), {
        ...validHistory,
        sessionId: 'session-2026-07-01',
        schemaVersion: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
    );
  });

  it.each([
    { ...validHistory, Reps: 0 },
    { ...validHistory, RPE: 11 },
    { ...validHistory, Carga: -1 },
    { ...validHistory, Data: '01/07/2026' },
    { ...validHistory, extra: true },
  ])('rejects an invalid history record', async (invalidHistory) => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();

    await assertFails(
      setDoc(
        doc(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos/invalid`),
        invalidHistory,
      ),
    );
  });

  it('rejects the entire batch when one record is invalid', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const firstReference = doc(
      database,
      `usuarios/${PRIMARY_USER_ID}/historico_treinos/batch-valid`,
    );
    const secondReference = doc(
      database,
      `usuarios/${PRIMARY_USER_ID}/historico_treinos/batch-invalid`,
    );
    const batch = writeBatch(database);

    batch.set(firstReference, validHistory);
    batch.set(secondReference, { ...validHistory, RPE: 99 });

    await assertFails(batch.commit());

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      expect((await getDoc(doc(context.firestore(), firstReference.path))).exists()).toBe(
        false,
      );
      expect(
        (await getDoc(doc(context.firestore(), secondReference.path))).exists(),
      ).toBe(false);
    });
  });
});

describe('historico_pesos validation', () => {
  it('allows an owner to upsert a valid weight by date', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const reference = doc(
      database,
      `usuarios/${PRIMARY_USER_ID}/historico_pesos/2026-07-01`,
    );

    await assertSucceeds(setDoc(reference, validWeight));
    await assertSucceeds(setDoc(reference, { ...validWeight, Peso: 79.5 }));
  });

  it.each([
    { ...validWeight, Peso: 29.9 },
    { ...validWeight, Peso: 501 },
    { ...validWeight, Data: '2026-7-1' },
    { ...validWeight, extra: true },
  ])('rejects an invalid weight entry', async (invalidWeight) => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();

    await assertFails(
      setDoc(
        doc(database, `usuarios/${PRIMARY_USER_ID}/historico_pesos/invalid`),
        invalidWeight,
      ),
    );
  });
});
