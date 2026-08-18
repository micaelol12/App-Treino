import type { WorkoutPlanExercise } from '../../domain/workout-plan-exercise';
import { parseFirestoreDocument } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';
import { workoutConfigDocumentSchema } from './workout-config.schema';

export const LEGACY_FALLBACK_EXERCISE_ORDER = 99;

export function mapWorkoutConfigDocument(
  documentId: string,
  data: unknown,
): WorkoutPlanExercise {
  const document = parseFirestoreDocument(
    workoutConfigDocumentSchema,
    'config_treinos',
    documentId,
    data,
  );

  return {
    id: `legacy:${documentId}`,
    documentId,
    divisionId: `legacy:${encodeURIComponent(document.Divisao)}`,
    division: document.Divisao,
    divisionOrder: 999,
    exerciseId: `legacy:${documentId}`,
    name: document.Exercicio,
    defaultSets: document.Series_Padrao,
    order: document.Ordem ?? LEGACY_FALLBACK_EXERCISE_ORDER,
    sourceSchemaVersion: document.schemaVersion ?? 0,
    ...(document.createdAt ? { createdAt: document.createdAt.toDate() } : {}),
    ...(document.updatedAt ? { updatedAt: document.updatedAt.toDate() } : {}),
  };
}
