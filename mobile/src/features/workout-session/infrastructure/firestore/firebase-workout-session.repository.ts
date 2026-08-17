import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  documentId,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';

import { WorkoutSessionFailure } from '../../application/workout-session-failure';
import type {
  WorkoutHistoryPage,
  WorkoutHistoryPageCursor,
  WorkoutSessionRepository,
} from '../../application/workout-session-repository';
import type { CompletedWorkoutSession } from '../../domain/workout-session-draft';
import type { WorkoutHistoryUpdate } from '../../domain/workout-history';
import { getFirebaseFirestore } from '../../../../shared/infrastructure/firebase/firebase-firestore';
import { InvalidFirestoreDocumentError } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';

import { mapWorkoutHistoryDocument } from './workout-history.mapper';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new WorkoutSessionFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function historyPath(userId: string): string {
  return `usuarios/${userId}/historico_treinos`;
}

function deterministicSetId(
  sessionId: string,
  planExerciseId: string,
  setNumber: number,
): string {
  return `${encodeURIComponent(sessionId)}__${encodeURIComponent(planExerciseId)}__${setNumber}`;
}

function mapFirestoreFailure(error: unknown): WorkoutSessionFailure {
  if (error instanceof WorkoutSessionFailure) return error;
  if (error instanceof InvalidFirestoreDocumentError) {
    return new WorkoutSessionFailure('invalid-data', { cause: error });
  }
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new WorkoutSessionFailure('permission-denied', { cause: error });
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return new WorkoutSessionFailure('network', { cause: error });
    }
  }

  return new WorkoutSessionFailure('unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}

export class FirebaseWorkoutSessionRepository implements WorkoutSessionRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async complete(userId: string, session: CompletedWorkoutSession): Promise<void> {
    if (session.sets.length > 500) {
      throw new WorkoutSessionFailure('too-many-sets');
    }

    try {
      const batch = writeBatch(this.database);
      const timestamp = serverTimestamp();

      for (const set of session.sets) {
        const documentId = deterministicSetId(
          session.sessionId,
          set.planExerciseId,
          set.setNumber,
        );
        batch.set(doc(this.database, historyPath(userId), documentId), {
          Data: session.performedOn,
          Treino: session.division,
          Exercício: set.exerciseName,
          Série: set.setNumber,
          Carga: set.loadKg,
          Reps: set.repetitions,
          RPE: set.rpe,
          Obs: set.note,
          sessionId: session.sessionId,
          schemaVersion: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      await batch.commit();
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async listHistoryPage(
    userId: string,
    pageSize: number,
    cursor?: WorkoutHistoryPageCursor,
  ): Promise<WorkoutHistoryPage> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('Data', 'desc'),
        orderBy(documentId(), 'desc'),
        queryLimit(pageSize),
      ];
      if (cursor) constraints.push(startAfter(cursor.performedOn, cursor.id));
      const snapshot = await getDocs(
        query(collection(this.database, historyPath(userId)), ...constraints),
      );
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

  async listExerciseHistory(userId: string, exerciseName: string, pageSize: number) {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.database, historyPath(userId)),
          where('Exercício', '==', exerciseName),
          orderBy('Data', 'desc'),
          orderBy(documentId(), 'desc'),
          queryLimit(pageSize),
        ),
      );
      return snapshot.docs.map((item) => mapWorkoutHistoryDocument(item.id, item.data()));
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async updateHistory(userId: string, update: WorkoutHistoryUpdate): Promise<void> {
    if (update.sets.length > 500) throw new WorkoutSessionFailure('too-many-sets');
    try {
      const batch = writeBatch(this.database);
      const timestamp = serverTimestamp();
      for (const set of update.sets) {
        batch.update(doc(this.database, historyPath(userId), set.id), {
          Data: update.performedOn,
          Treino: update.workoutName,
          Carga: set.loadKg,
          Reps: set.repetitions,
          RPE: set.rpe,
          Obs: set.note,
          updatedAt: timestamp,
        });
      }
      await batch.commit();
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async deleteHistory(userId: string, documentIds: readonly string[]): Promise<void> {
    if (documentIds.length > 500) throw new WorkoutSessionFailure('too-many-sets');
    try {
      const batch = writeBatch(this.database);
      for (const id of documentIds) {
        batch.delete(doc(this.database, historyPath(userId), id));
      }
      await batch.commit();
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }
}

export function createFirebaseWorkoutSessionRepository(): WorkoutSessionRepository {
  return new FirebaseWorkoutSessionRepository();
}
