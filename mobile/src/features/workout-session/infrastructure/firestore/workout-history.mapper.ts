import type { WorkoutSetRecord } from '../../domain/workout-set-record';
import { parseFirestoreDocument } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';
import { workoutHistoryDocumentSchema } from './workout-history.schema';

export function mapWorkoutHistoryDocument(
  documentId: string,
  data: unknown,
): WorkoutSetRecord {
  const document = parseFirestoreDocument(
    workoutHistoryDocumentSchema,
    'historico_treinos',
    documentId,
    data,
  );

  return {
    id: documentId,
    performedOn: document.Data,
    workoutName: document.Treino,
    exerciseName: document.Exercício,
    setNumber: document.Série,
    loadKg: document.Carga,
    repetitions: document.Reps,
    rpe: document.RPE,
    note: document.Obs,
    sourceSchemaVersion: document.schemaVersion ?? 0,
    ...(document.sessionId ? { sessionId: document.sessionId } : {}),
    ...(document.createdAt ? { createdAt: document.createdAt.toDate() } : {}),
    ...(document.updatedAt ? { updatedAt: document.updatedAt.toDate() } : {}),
  };
}
