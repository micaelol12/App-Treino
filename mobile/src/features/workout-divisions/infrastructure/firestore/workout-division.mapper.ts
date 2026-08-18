import type { WorkoutDivision } from '../../domain/workout-division';
import { parseFirestoreDocument } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { workoutDivisionDocumentSchema } from './workout-division.schema';

export function mapWorkoutDivisionDocument(
  documentId: string,
  data: unknown,
): WorkoutDivision {
  const document = parseFirestoreDocument(
    workoutDivisionDocumentSchema,
    'divisoes',
    documentId,
    data,
  );
  return {
    id: documentId,
    name: document.name,
    order: document.order,
    active: document.active,
    sourceSchemaVersion: 2,
    ...(document.createdAt ? { createdAt: document.createdAt.toDate() } : {}),
    ...(document.updatedAt ? { updatedAt: document.updatedAt.toDate() } : {}),
  };
}
