import { FirebaseError } from 'firebase/app';
import {
  collection,
  documentId,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  startAfter,
  where,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';

import { mapWorkoutHistoryDocument } from '@/features/workout-session/infrastructure/firestore/workout-history.mapper';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';

import { ProgressFailure } from '../../application/progress-failure';
import type {
  ProgressPage,
  ProgressPageCursor,
  ProgressRepository,
} from '../../application/progress-repository';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new ProgressFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function collectionPath(userId: string): string {
  return `usuarios/${userId}/historico_treinos`;
}

function mapFirestoreFailure(error: unknown): ProgressFailure {
  if (error instanceof ProgressFailure) return error;
  if (error instanceof InvalidFirestoreDocumentError) {
    return new ProgressFailure('invalid-data', { cause: error });
  }
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new ProgressFailure('permission-denied', { cause: error });
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return new ProgressFailure('network', { cause: error });
    }
  }
  return new ProgressFailure('unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}

export class FirebaseProgressRepository implements ProgressRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async listExercisePage(
    userId: string,
    exerciseId: string | undefined,
    exerciseName: string,
    pageSize: number,
    cursor?: ProgressPageCursor,
  ): Promise<ProgressPage> {
    try {
      const run = async (field: 'exerciseId' | 'Exercício', value: string) => {
        const constraints: QueryConstraint[] = [
          where(field, '==', value),
          orderBy('Data', 'desc'),
          orderBy(documentId(), 'desc'),
          queryLimit(pageSize),
        ];
        if (cursor) constraints.push(startAfter(cursor.performedOn, cursor.id));
        return getDocs(
          query(collection(this.database, collectionPath(userId)), ...constraints),
        );
      };
      let snapshot = await run(
        exerciseId ? 'exerciseId' : 'Exercício',
        exerciseId ?? exerciseName,
      );
      if (snapshot.empty && exerciseId && !cursor) {
        snapshot = await run('Exercício', exerciseName);
      }
      const records = snapshot.docs.map((item) =>
        mapWorkoutHistoryDocument(item.id, item.data()),
      );
      const last = records.at(-1);
      return {
        records,
        nextCursor:
          records.length === pageSize && last
            ? { id: last.id, performedOn: last.performedOn }
            : null,
      };
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }
}

export function createFirebaseProgressRepository(): ProgressRepository {
  return new FirebaseProgressRepository();
}
