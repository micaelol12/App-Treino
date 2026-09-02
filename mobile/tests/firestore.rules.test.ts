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
  orderBy,
  query,
  setDoc,
  setLogLevel,
  Timestamp,
  type Firestore,
  where,
} from 'firebase/firestore';

import { FirebaseProgressRepository } from '../src/features/progress/infrastructure/firestore/firebase-progress.repository';
import { FirebaseWorkoutDivisionRepository } from '../src/features/workout-divisions/infrastructure/firestore/firebase-workout-division.repository';
import { FirebaseWorkoutDivisionTemplateRepository } from '../src/features/workout-division-templates/infrastructure/firestore/firebase-workout-division-template.repository';
import { WorkoutPlanService } from '../src/features/workout-plans/application/workout-plan-service';
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

function validDivisionTemplate(status: 'draft' | 'published' = 'published') {
  const timestamp = Timestamp.now();
  return {
    name: 'Push pronto',
    description: 'Peito, ombros e tríceps.',
    level: 'Intermediário',
    goal: 'Hipertrofia',
    status,
    displayOrder: 1,
    exerciseCount: 1,
    version: 1,
    schemaVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: status === 'published' ? timestamp : null,
  };
}

function validDivisionTemplateExercise() {
  const timestamp = Timestamp.now();
  return {
    exerciseId: EXERCISE_ID,
    exerciseDocumentId: EXERCISE_DOCUMENT_ID,
    exerciseNameSnapshot: validExercise.name,
    defaultSets: 3,
    order: 1,
    schemaVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function seedDivisionTemplate(
  templateId: string,
  status: 'draft' | 'published' = 'published',
) {
  await seedExercise();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(
      doc(database, `modelos_divisao/${templateId}`),
      validDivisionTemplate(status),
    );
    await setDoc(
      doc(database, `modelos_divisao/${templateId}/exercicios/${EXERCISE_DOCUMENT_ID}`),
      validDivisionTemplateExercise(),
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

  it('allows only administrators to maintain valid catalog documents', async () => {
    const admin = testEnvironment
      .authenticatedContext('catalog_admin', { admin: true })
      .firestore();
    const regularUser = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const timestamp = Timestamp.now();
    const exercise = {
      ...validExercise,
      images: ['https://storage.example/exercise.jpg'],
      videoUrl: 'https://storage.example/exercise.mp4',
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const equipment = {
      id: 'barra-hexagonal',
      name: 'Barra hexagonal',
      active: true,
      order: 100,
      schemaVersion: 1,
    };

    await assertSucceeds(setDoc(doc(admin, 'exercicios/admin-created'), exercise));
    await assertSucceeds(setDoc(doc(admin, 'equipamentos/admin-created'), equipment));
    await assertFails(setDoc(doc(regularUser, 'equipamentos/user-created'), equipment));
    await assertFails(
      setDoc(doc(admin, 'exercicios/invalid'), { ...exercise, unexpected: true }),
    );
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

describe('published division template rules', () => {
  it('exposes only published templates to authenticated users', async () => {
    await seedDivisionTemplate('published');
    await seedDivisionTemplate('draft', 'draft');
    const owner = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const anonymous = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(owner, 'modelos_divisao/published')));
    await assertSucceeds(
      getDoc(doc(owner, `modelos_divisao/published/exercicios/${EXERCISE_DOCUMENT_ID}`)),
    );
    await assertFails(getDoc(doc(owner, 'modelos_divisao/draft')));
    await assertFails(getDoc(doc(anonymous, 'modelos_divisao/published')));
    await assertSucceeds(
      getDocs(
        query(
          collection(owner, 'modelos_divisao'),
          where('status', '==', 'published'),
          orderBy('displayOrder', 'asc'),
        ),
      ),
    );
    await assertFails(getDocs(collection(owner, 'modelos_divisao')));
  });

  it('allows only administrators to maintain valid templates', async () => {
    await seedExercise();
    const admin = testEnvironment
      .authenticatedContext('template_admin', { admin: true })
      .firestore();
    const owner = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const templatePath = 'modelos_divisao/admin-template';

    await assertSucceeds(
      setDoc(doc(admin, templatePath), validDivisionTemplate('draft')),
    );
    await assertSucceeds(
      setDoc(
        doc(admin, `${templatePath}/exercicios/${EXERCISE_DOCUMENT_ID}`),
        validDivisionTemplateExercise(),
      ),
    );
    await assertFails(
      setDoc(doc(owner, 'modelos_divisao/user-template'), validDivisionTemplate()),
    );
    await assertFails(
      setDoc(doc(admin, 'modelos_divisao/invalid'), {
        ...validDivisionTemplate(),
        exerciseCount: 0,
      }),
    );
  });

  it('imports a published template atomically into the owner plan', async () => {
    await seedDivisionTemplate('push-template');
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWorkoutDivisionTemplateRepository(
      database as unknown as Firestore,
    );
    const template = await repository.getPublished('push-template');

    const divisionId = await repository.importToUser(
      PRIMARY_USER_ID,
      template,
      'Push personalizado',
      1,
    );
    const division = await getDoc(
      doc(database, `usuarios/${PRIMARY_USER_ID}/divisoes/${divisionId}`),
    );
    const item = await getDoc(
      doc(
        database,
        `usuarios/${PRIMARY_USER_ID}/divisoes/${divisionId}/exercicios/${EXERCISE_DOCUMENT_ID}`,
      ),
    );

    expect(division.data()).toMatchObject({
      name: 'Push personalizado',
      sourceTemplateId: 'push-template',
      sourceTemplateVersion: 1,
    });
    expect(item.data()).toMatchObject({
      exerciseId: EXERCISE_ID,
      exerciseDocumentId: EXERCISE_DOCUMENT_ID,
      defaultSets: 3,
    });
  });

  it('keeps a 15-exercise import within atomic rule access limits', async () => {
    const timestamp = Timestamp.now();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore();
      await setDoc(doc(database, 'modelos_divisao/full-template'), {
        ...validDivisionTemplate(),
        exerciseCount: 15,
      });
      await Promise.all(
        Array.from({ length: 15 }, async (_, index) => {
          const documentId = `exercise-document-${index + 1}`;
          const exerciseId = `exercise-${index + 1}`;
          const name = `Exercício ${index + 1}`;
          await setDoc(doc(database, `exercicios/${documentId}`), {
            ...validExercise,
            id: exerciseId,
            name,
          });
          await setDoc(
            doc(database, `modelos_divisao/full-template/exercicios/${documentId}`),
            {
              exerciseId,
              exerciseDocumentId: documentId,
              exerciseNameSnapshot: name,
              defaultSets: 3,
              order: index + 1,
              schemaVersion: 1,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          );
        }),
      );
    });
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const repository = new FirebaseWorkoutDivisionTemplateRepository(
      database as unknown as Firestore,
    );
    const template = await repository.getPublished('full-template');
    const divisionId = await repository.importToUser(
      PRIMARY_USER_ID,
      template,
      'Divisão completa',
      1,
    );

    const imported = await getDocs(
      collection(
        database,
        `usuarios/${PRIMARY_USER_ID}/divisoes/${divisionId}/exercicios`,
      ),
    );
    expect(imported.size).toBe(15);
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

  it('persists division and exercise reorder batches', async () => {
    await seedExercise();
    const secondDocumentId = 'firestore-auto-id-2';
    const secondExerciseId = 'Dumbbell_Fly';
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `exercicios/${secondDocumentId}`), {
        ...validExercise,
        id: secondExerciseId,
        name: 'Crucifixo com halteres',
      });
    });
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    await Promise.all([
      setDoc(doc(database, `usuarios/${PRIMARY_USER_ID}/divisoes/push`), validDivision()),
      setDoc(doc(database, `usuarios/${PRIMARY_USER_ID}/divisoes/pull`), {
        ...validDivision(),
        name: 'Pull',
        order: 2,
      }),
    ]);

    const divisionRepository = new FirebaseWorkoutDivisionRepository(
      database as unknown as Firestore,
    );
    await divisionRepository.updateOrder(PRIMARY_USER_ID, [
      { id: 'pull', order: 1 },
      { id: 'push', order: 2 },
    ]);
    await expect(divisionRepository.list(PRIMARY_USER_ID)).resolves.toEqual([
      expect.objectContaining({ id: 'pull', order: 1 }),
      expect.objectContaining({ id: 'push', order: 2 }),
    ]);

    const planRepository = new FirebaseWorkoutPlanRepository(
      database as unknown as Firestore,
    );
    await planRepository.create(PRIMARY_USER_ID, {
      divisionId: 'push',
      divisionNameSnapshot: 'Push',
      exerciseId: EXERCISE_ID,
      exerciseDocumentId: EXERCISE_DOCUMENT_ID,
      exerciseNameSnapshot: validExercise.name,
      defaultSets: 3,
      order: 1,
    });
    await planRepository.create(PRIMARY_USER_ID, {
      divisionId: 'push',
      divisionNameSnapshot: 'Push',
      exerciseId: secondExerciseId,
      exerciseDocumentId: secondDocumentId,
      exerciseNameSnapshot: 'Crucifixo com halteres',
      defaultSets: 3,
      order: 2,
    });
    await planRepository.updateOrder(PRIMARY_USER_ID, [
      {
        id: `push__${secondDocumentId}`,
        divisionId: 'push',
        documentId: secondDocumentId,
        order: 1,
      },
      {
        id: `push__${EXERCISE_DOCUMENT_ID}`,
        divisionId: 'push',
        documentId: EXERCISE_DOCUMENT_ID,
        order: 2,
      },
    ]);
    const reordered = (
      await new WorkoutPlanService(planRepository).list(PRIMARY_USER_ID)
    ).filter(({ divisionId }) => divisionId === 'push');
    expect(reordered).toEqual([
      expect.objectContaining({ documentId: secondDocumentId, order: 1 }),
      expect.objectContaining({ documentId: EXERCISE_DOCUMENT_ID, order: 2 }),
    ]);
  });

  it('deletes a division with its exercises and preserves workout history', async () => {
    await seedExercise();
    const database = testEnvironment.authenticatedContext(PRIMARY_USER_ID).firestore();
    const divisionPath = `usuarios/${PRIMARY_USER_ID}/divisoes/push`;
    const itemPath = `${divisionPath}/exercicios/${EXERCISE_DOCUMENT_ID}`;
    const historyPath = `usuarios/${PRIMARY_USER_ID}/historico_treinos/history`;
    await setDoc(doc(database, divisionPath), validDivision());
    await setDoc(doc(database, itemPath), validPlanItem());
    await setDoc(doc(database, historyPath), validHistory);

    const repository = new FirebaseWorkoutDivisionRepository(
      database as unknown as Firestore,
    );
    await repository.delete(PRIMARY_USER_ID, 'push');

    expect((await getDoc(doc(database, divisionPath))).exists()).toBe(false);
    expect(
      (await getDocs(collection(database, `${divisionPath}/exercicios`))).empty,
    ).toBe(true);
    expect((await getDoc(doc(database, historyPath))).exists()).toBe(true);
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
