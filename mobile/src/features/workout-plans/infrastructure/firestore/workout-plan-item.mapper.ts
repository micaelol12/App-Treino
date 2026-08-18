import type { WorkoutDivision } from '@/features/workout-divisions/domain/workout-division';
import type { WorkoutPlanExercise } from '../../domain/workout-plan-exercise';
import { parseFirestoreDocument } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { workoutPlanItemDocumentSchema } from './workout-plan-item.schema';

export function mapWorkoutPlanItemDocument(
  division: WorkoutDivision,
  documentId: string,
  data: unknown,
): WorkoutPlanExercise | null {
  const document = parseFirestoreDocument(
    workoutPlanItemDocumentSchema,
    'divisoes/exercicios',
    documentId,
    data,
  );
  if (!division.active || !document.active) return null;

  return {
    id: `${division.id}__${documentId}`,
    documentId,
    divisionId: division.id,
    division: division.name,
    divisionOrder: division.order,
    exerciseId: document.exerciseId,
    exerciseDocumentId: document.exerciseDocumentId,
    name: document.exerciseNameSnapshot,
    defaultSets: document.defaultSets,
    order: document.order,
    sourceSchemaVersion: 2,
    ...(document.createdAt ? { createdAt: document.createdAt.toDate() } : {}),
    ...(document.updatedAt ? { updatedAt: document.updatedAt.toDate() } : {}),
  };
}
