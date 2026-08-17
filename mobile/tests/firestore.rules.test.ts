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
  collection,
  doc,
  getDoc,
  getDocs,
  setLogLevel,
  setDoc,
  Timestamp,
  type Firestore,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { FirebaseWorkoutPlanRepository } from '../src/features/workout-plans/infrastructure/firestore/firebase-workout-plan.repository';
import { FirebaseWorkoutSessionRepository } from '../src/features/workout-session/infrastructure/firestore/firebase-workout-session.repository';
import { FirebaseWeightRepository } from '../src/features/weight/infrastructure/firestore/firebase-weight.repository';
import { FirebaseProgressRepository } from '../src/features/progress/infrastructure/firestore/firebase-progress.repository';

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
  it('completes a session in batch without duplicating records on retry', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWorkoutSessionRepository(
      database as unknown as Firestore,
    );
    const session = {
      sessionId: 'session-idempotent',
      performedOn: '2026-08-15',
      division: 'Push',
      sets: [
        {
          planExerciseId: 'bench',
          exerciseName: 'Supino Reto',
          setNumber: 1,
          loadKg: 60,
          repetitions: 10,
          rpe: 8,
          note: '',
        },
        {
          planExerciseId: 'bench',
          exerciseName: 'Supino Reto',
          setNumber: 2,
          loadKg: 60,
          repetitions: 8,
          rpe: 9,
          note: '',
        },
      ],
    };

    await repository.complete(PRIMARY_USER_ID, session);
    await repository.complete(PRIMARY_USER_ID, session);

    const snapshot = await getDocs(
      collection(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos`),
    );
    expect(snapshot.docs).toHaveLength(2);
    expect(snapshot.docs.map((item) => item.data().sessionId)).toEqual([
      'session-idempotent',
      'session-idempotent',
    ]);
  });

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

  it('upserts with a deterministic ID and paginates legacy entries', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWeightRepository(database as unknown as Firestore);

    await setDoc(
      doc(database, `usuarios/${PRIMARY_USER_ID}/historico_pesos/legacy-random-id`),
      { Data: '2026-07-01', Peso: 80 },
    );
    await repository.upsert(PRIMARY_USER_ID, {
      recordedOn: '2026-07-02',
      weightKg: 79.8,
    });
    await repository.upsert(PRIMARY_USER_ID, {
      recordedOn: '2026-07-02',
      weightKg: 79.7,
    });

    const firstPage = await repository.listPage(PRIMARY_USER_ID, 1);
    const secondPage = await repository.listPage(
      PRIMARY_USER_ID,
      1,
      firstPage.nextCursor ?? undefined,
    );

    expect(firstPage.entries).toEqual([
      expect.objectContaining({ id: '2026-07-02', weightKg: 79.7 }),
    ]);
    expect(secondPage.entries).toEqual([
      expect.objectContaining({ id: 'legacy-random-id', weightKg: 80 }),
    ]);
    expect(
      (
        await getDoc(
          doc(database, `usuarios/${PRIMARY_USER_ID}/historico_pesos/2026-07-02`),
        )
      ).data(),
    ).toMatchObject({
      Data: '2026-07-02',
      Peso: 79.7,
      schemaVersion: 1,
      createdAt: expect.any(Timestamp),
      updatedAt: expect.any(Timestamp),
    });
  });
});

describe('progress repository integration', () => {
  it('filters one exercise and paginates newest records first', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseProgressRepository(database as unknown as Firestore);
    await setDoc(
      doc(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos/supino-old`),
      validHistory,
    );
    await setDoc(
      doc(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos/supino-new`),
      { ...validHistory, Data: '2026-07-08', Carga: 62.5 },
    );
    await setDoc(
      doc(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos/other-exercise`),
      { ...validHistory, Exercício: 'Crucifixo' },
    );

    const firstPage = await repository.listExercisePage(
      PRIMARY_USER_ID,
      'Supino Reto',
      1,
    );
    const secondPage = await repository.listExercisePage(
      PRIMARY_USER_ID,
      'Supino Reto',
      1,
      firstPage.nextCursor ?? undefined,
    );

    expect(firstPage.records).toEqual([
      expect.objectContaining({ id: 'supino-new', performedOn: '2026-07-08' }),
    ]);
    expect(secondPage.records).toEqual([
      expect.objectContaining({ id: 'supino-old', performedOn: '2026-07-01' }),
    ]);
  });
});
