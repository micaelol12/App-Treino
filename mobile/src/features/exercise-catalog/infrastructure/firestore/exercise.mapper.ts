import type { Exercise } from '../../domain/exercise';
import { parseFirestoreDocument } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { exerciseDocumentSchema } from './exercise.schema';

export function mapExerciseDocument(documentId: string, data: unknown): Exercise {
  const document = parseFirestoreDocument(
    exerciseDocumentSchema,
    'exercicios',
    documentId,
    data,
  );

  return { documentId, ...document };
}
