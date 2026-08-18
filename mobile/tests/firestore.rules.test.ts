import fs from 'node:fs';
import path from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  setLogLevel,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';

import { FirebaseProgressRepository } from '../src/features/progress/infrastructure/firestore/firebase-progress.repository';
import { FirebaseWorkoutPlanRepository } from '../src/features/workout-plans/infrastructure/firestore/firebase-workout-plan.repository';
import { FirebaseWorkoutSessionRepository } from '../src/features/workout-session/infrastructure/firestore/firebase-workout-session.repository';
import { FirebaseWeightRepository } from '../src/features/weight/infrastructure/firestore/firebase-weight.repository';

const PROJECT_ID = 'demo-app-treino';
const PRIMARY_USER_ID = 'qa_primary_user';
const SECONDARY_USER_ID = 'qa_secondary_user';
const EXERCISE_DOCUMENT_ID = 'firestore-auto-id';
const EXERCISE_ID = 'Barbell_Bench_Press_-_Medium_Grip';

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

const validWeight = { Data: '2026-07-01', Peso: 79.6 };

const validExercise = {
  id: EXERCISE_ID,
  name: 'Supino Reto com Barra - Pegada Média',
  force: 'push',
  level: 'iniciante',
  mechanic: 'composto',
  equipment: 'barra',
  primaryMuscles: ['peito'],
  secondaryMuscles: ['triceps'],
  instructions: ['Execute o movimento com controle.'],
  category: 'forca',
  images: ['bench/0.jpg'],
};

function validDivision() {
  const timestamp = Timestamp.now();
  return {
    name: 'Push',
    order: 1,
    active: true,
    schemaVersion: 2,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function validPlanItem() {
  const timestamp = Timestamp.now();
  return {
    exerciseId: EXERCISE_ID,
    exerciseDocumentId: EXERCISE_DOCUMENT_ID,
    exerciseNameSnapshot: validExercise.name,
    defaultSets: 3,
    order: 1,
    active: true,
    schemaVersion: 2,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel('silent');
  const rulesPath = path.resolve(__dirname, '../../firebase/firestore.rules');
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: fs.readFileSync(rulesPath, 'utf8') },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

async function seedExercise() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), `exercicios/${EXERCISE_DOCUMENT_ID}`),
      validExercise,
    );
  });
}

describe('global exercise catalog rules', () => {
  it('allows authenticated reads and denies anonymous reads and client writes', async () => {
    await seedExercise();
    const owner = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const anonymous = testEnvironment.unauthenticatedContext().firestore();
    const reference = doc(owner, `exercicios/${EXERCISE_DOCUMENT_ID}`);

    await assertSucceeds(getDoc(reference));
    await assertFails(getDoc(doc(anonymous, `exercicios/${EXERCISE_DOCUMENT_ID}`)));
    await assertFails(setDoc(reference, validExercise));
  });

  it('allows authenticated reads from every taxonomy collection', async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      for (const name of [
        'equipamentos',
        'categorias',
        'forcas',
        'niveis',
        'mecanicas',
        'musculos',
      ]) {
        await setDoc(doc(context.firestore(), `${name}/auto-id`), {
          id: 'valor',
          name: 'Valor',
        });
      }
    });
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    for (const name of [
      'equipamentos',
      'categorias',
      'forcas',
      'niveis',
      'mecanicas',
      'musculos',
    ]) {
      await assertSucceeds(getDoc(doc(database, `${name}/auto-id`)));
    }
  });
});

describe('division and plan v2 rules', () => {
  it('validates ownership and the physical exercise reference', async () => {
    await seedExercise();
    const owner = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const intruder = testEnvironment.authenticatedContext(SECONDARY_USER_ID).firestore();
    const divisionPath = `usuarios/${PRIMARY_USER_ID}/divisoes/push`;
    const itemPath = `${divisionPath}/exercicios/${EXERCISE_DOCUMENT_ID}`;

    await assertSucceeds(setDoc(doc(owner, divisionPath), validDivision()));
    await assertSucceeds(setDoc(doc(owner, itemPath), validPlanItem()));
    await assertFails(getDoc(doc(intruder, divisionPath)));
    await assertFails(setDoc(doc(intruder, itemPath), validPlanItem()));
    await assertFails(
      setDoc(doc(owner, `${divisionPath}/exercicios/missing`), {
        ...validPlanItem(),
        exerciseDocumentId: 'missing',
      }),
    );
  });

  it('supports repository CRUD with auto-ID catalog documents', async () => {
    await seedExercise();
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    await setDoc(
      doc(database, `usuarios/${PRIMARY_USER_ID}/divisoes/push`),
      validDivision(),
    );
    const repository = new FirebaseWorkoutPlanRepository(
      database as unknown as Firestore,
    );
    const draft = {
      divisionId: 'push',
      divisionNameSnapshot: 'Push',
      exerciseId: EXERCISE_ID,
      exerciseDocumentId: EXERCISE_DOCUMENT_ID,
      exerciseNameSnapshot: validExercise.name,
      defaultSets: 3,
      order: 1,
    };

    await expect(repository.create(PRIMARY_USER_ID, draft)).resolves.toBe(
      `push__${EXERCISE_DOCUMENT_ID}`,
    );
    const [created] = await repository.list(PRIMARY_USER_ID);
    expect(created).toMatchObject({
      divisionId: 'push',
      exerciseId: EXERCISE_ID,
      exerciseDocumentId: EXERCISE_DOCUMENT_ID,
      sourceSchemaVersion: 2,
    });

    await repository.update(PRIMARY_USER_ID, created!, {
      ...draft,
      defaultSets: 4,
      order: 2,
    });
    expect((await repository.list(PRIMARY_USER_ID))[0]).toMatchObject({
      defaultSets: 4,
      order: 2,
    });
    await repository.delete(PRIMARY_USER_ID, created!);
    await expect(repository.list(PRIMARY_USER_ID)).resolves.toEqual([]);
  });

  it('falls back to legacy config when no v2 division exists', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    await setDoc(
      doc(database, `usuarios/${PRIMARY_USER_ID}/config_treinos/legacy`),
      validConfig,
    );
    const repository = new FirebaseWorkoutPlanRepository(
      database as unknown as Firestore,
    );
    await expect(repository.list(PRIMARY_USER_ID)).resolves.toEqual([
      expect.objectContaining({ id: 'legacy:legacy', sourceSchemaVersion: 0 }),
    ]);
  });
});

describe('history v2 and legacy compatibility', () => {
  it('writes stable IDs, retries idempotently and queries by exercise ID', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWorkoutSessionRepository(
      database as unknown as Firestore,
    );
    const session = {
      sessionId: 'session-idempotent',
      performedOn: '2026-08-15',
      divisionId: 'push',
      division: 'Push',
      sets: [
        {
          planExerciseId: `push__${EXERCISE_DOCUMENT_ID}`,
          exerciseId: EXERCISE_ID,
          exerciseDocumentId: EXERCISE_DOCUMENT_ID,
          exerciseName: validExercise.name,
          setNumber: 1,
          loadKg: 60,
          repetitions: 10,
          rpe: 8,
          note: '',
        },
      ],
    };

    await repository.complete(PRIMARY_USER_ID, session);
    await repository.complete(PRIMARY_USER_ID, session);
    const snapshot = await getDocs(
      collection(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos`),
    );
    expect(snapshot).toHaveProperty('size', 1);
    expect(snapshot.docs[0]?.data()).toMatchObject({
      divisionId: 'push',
      exerciseId: EXERCISE_ID,
      exerciseDocumentId: EXERCISE_DOCUMENT_ID,
      schemaVersion: 2,
    });
    await expect(
      repository.listExerciseHistory(
        PRIMARY_USER_ID,
        EXERCISE_ID,
        validExercise.name,
        10,
      ),
    ).resolves.toHaveLength(1);
  });

  it('accepts legacy history and progress falls back to its name', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    await assertSucceeds(
      setDoc(
        doc(database, `usuarios/${PRIMARY_USER_ID}/historico_treinos/legacy`),
        validHistory,
      ),
    );
    const repository = new FirebaseProgressRepository(database as unknown as Firestore);
    const page = await repository.listExercisePage(
      PRIMARY_USER_ID,
      undefined,
      'Supino Reto',
      10,
    );
    expect(page.records).toEqual([
      expect.objectContaining({ id: 'legacy', sourceSchemaVersion: 0 }),
    ]);
  });
});

describe('remaining private collections', () => {
  it('keeps config and weight private and validates their shapes', async () => {
    const owner = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const intruder = testEnvironment.authenticatedContext(SECONDARY_USER_ID).firestore();
    const configReference = doc(
      owner,
      `usuarios/${PRIMARY_USER_ID}/config_treinos/config`,
    );
    const weightReference = doc(
      owner,
      `usuarios/${PRIMARY_USER_ID}/historico_pesos/2026-07-01`,
    );
    await assertSucceeds(setDoc(configReference, validConfig));
    await assertSucceeds(setDoc(weightReference, validWeight));
    await assertFails(
      getDoc(doc(intruder, `usuarios/${PRIMARY_USER_ID}/historico_pesos/2026-07-01`)),
    );
    await assertFails(setDoc(weightReference, { ...validWeight, Peso: 10 }));
  });

  it('keeps deterministic weight upsert behavior', async () => {
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWeightRepository(database as unknown as Firestore);
    await repository.upsert(PRIMARY_USER_ID, {
      recordedOn: '2026-07-02',
      weightKg: 79.8,
    });
    expect(
      (
        await getDoc(
          doc(database, `usuarios/${PRIMARY_USER_ID}/historico_pesos/2026-07-02`),
        )
      ).data(),
    ).toMatchObject({ Data: '2026-07-02', Peso: 79.8, schemaVersion: 1 });
    await assertSucceeds(
      deleteDoc(doc(database, `usuarios/${PRIMARY_USER_ID}/historico_pesos/2026-07-02`)),
    );
  });
});
