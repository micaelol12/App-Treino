import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { z } from 'zod';

import { database } from '../lib/firebase';

export const divisionTemplateStatusSchema = z.enum([
  'draft',
  'published',
  'archived',
]);

export const divisionTemplateExerciseSchema = z.object({
  exerciseId: z.string().trim().min(1).max(160),
  exerciseDocumentId: z.string().trim().min(1).max(128),
  exerciseNameSnapshot: z.string().trim().min(1).max(160),
  defaultSets: z.number().int().min(1).max(10),
  order: z.number().int().min(1).max(15),
});

export const divisionTemplateFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome.').max(80),
    description: z.string().trim().max(500),
    level: z.string().trim().max(80),
    goal: z.string().trim().max(80),
    status: divisionTemplateStatusSchema,
    displayOrder: z.number().int().min(0).max(9999),
    exercises: z.array(divisionTemplateExerciseSchema).max(15),
  })
  .superRefine((input, context) => {
    if (input.status === 'published' && input.exercises.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Adicione ao menos um exercício antes de publicar.',
        path: ['exercises'],
      });
    }
    const ids = input.exercises.map(({ exerciseDocumentId }) => exerciseDocumentId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Não repita exercícios na mesma divisão.',
        path: ['exercises'],
      });
    }
  });

export type DivisionTemplateStatus = z.infer<typeof divisionTemplateStatusSchema>;
export type DivisionTemplateExercise = z.infer<
  typeof divisionTemplateExerciseSchema
>;
export type DivisionTemplateFormInput = z.infer<typeof divisionTemplateFormSchema>;

export type DivisionTemplate = {
  documentId: string;
  name: string;
  description: string;
  level: string;
  goal: string;
  status: DivisionTemplateStatus;
  displayOrder: number;
  exerciseCount: number;
  version: number;
};

export type DivisionTemplateDetails = DivisionTemplate & {
  exercises: DivisionTemplateExercise[];
};

const storedTemplateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(500),
  level: z.string().max(80),
  goal: z.string().max(80),
  status: divisionTemplateStatusSchema,
  displayOrder: z.number().int().min(0).max(9999),
  exerciseCount: z.number().int().min(0).max(15),
  version: z.number().int().min(1).max(9999),
  schemaVersion: z.literal(1),
});

function mapTemplate(documentId: string, data: DocumentData): DivisionTemplate {
  return { documentId, ...storedTemplateSchema.parse(data) };
}

export async function listDivisionTemplates(): Promise<DivisionTemplate[]> {
  const snapshot = await getDocs(
    query(collection(database, 'modelos_divisao'), orderBy('displayOrder', 'asc')),
  );
  return snapshot.docs.map((item) => mapTemplate(item.id, item.data()));
}

export async function getDivisionTemplate(
  documentId: string,
): Promise<DivisionTemplateDetails> {
  const reference = doc(database, 'modelos_divisao', documentId);
  const [templateSnapshot, exerciseSnapshot] = await Promise.all([
    getDoc(reference),
    getDocs(
      query(collection(reference, 'exercicios'), orderBy('order', 'asc')),
    ),
  ]);
  if (!templateSnapshot.exists()) throw new Error('Divisão pronta não encontrada.');
  return {
    ...mapTemplate(templateSnapshot.id, templateSnapshot.data()),
    exercises: exerciseSnapshot.docs.map((item) =>
      divisionTemplateExerciseSchema.parse(item.data()),
    ),
  };
}

export async function saveDivisionTemplate(
  input: DivisionTemplateFormInput & { documentId?: string },
): Promise<string> {
  const parsed = divisionTemplateFormSchema.parse(input);
  const reference = input.documentId
    ? doc(database, 'modelos_divisao', input.documentId)
    : doc(collection(database, 'modelos_divisao'));
  const [existing, currentExercises] = await Promise.all([
    getDoc(reference),
    getDocs(collection(reference, 'exercicios')),
  ]);
  const current = existing.exists() ? storedTemplateSchema.parse(existing.data()) : null;
  const version = Math.min(9999, (current?.version ?? 0) + 1);
  const timestamp = serverTimestamp();
  const batch = writeBatch(database);

  batch.set(reference, {
    name: parsed.name,
    description: parsed.description,
    level: parsed.level,
    goal: parsed.goal,
    status: parsed.status,
    displayOrder: parsed.displayOrder,
    exerciseCount: parsed.exercises.length,
    version,
    schemaVersion: 1,
    createdAt: existing.data()?.createdAt ?? timestamp,
    updatedAt: timestamp,
    publishedAt:
      parsed.status === 'published'
        ? existing.data()?.publishedAt ?? timestamp
        : existing.data()?.publishedAt ?? null,
  });

  const selectedIds = new Set(
    parsed.exercises.map(({ exerciseDocumentId }) => exerciseDocumentId),
  );
  for (const exercise of currentExercises.docs) {
    if (!selectedIds.has(exercise.id)) batch.delete(exercise.ref);
  }
  parsed.exercises.forEach((exercise, index) => {
    const exerciseReference = doc(
      reference,
      'exercicios',
      exercise.exerciseDocumentId,
    );
    batch.set(exerciseReference, {
      ...exercise,
      order: index + 1,
      schemaVersion: 1,
      createdAt: currentExercises.docs.find(({ id }) => id === exercise.exerciseDocumentId)
        ?.data().createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  });
  await batch.commit();
  return reference.id;
}

export async function setDivisionTemplateStatus(
  documentId: string,
  status: DivisionTemplateStatus,
): Promise<void> {
  const reference = doc(database, 'modelos_divisao', documentId);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) throw new Error('Divisão pronta não encontrada.');
  const template = storedTemplateSchema.parse(snapshot.data());
  if (status === 'published' && template.exerciseCount === 0) {
    throw new Error('Adicione ao menos um exercício antes de publicar.');
  }
  await updateDoc(reference, {
    status,
    version: Math.min(9999, template.version + 1),
    updatedAt: serverTimestamp(),
    ...(status === 'published' ? { publishedAt: serverTimestamp() } : {}),
  });
}
