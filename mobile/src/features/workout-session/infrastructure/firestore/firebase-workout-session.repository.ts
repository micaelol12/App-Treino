import { FirebaseError } from 'firebase/app';
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { WorkoutSessionFailure } from '../../application/workout-session-failure';
import type { WorkoutSessionRepository } from '../../application/workout-session-repository';
import type { CompletedWorkoutSession } from '../../domain/workout-session-draft';
import { getFirebaseClient } from '../../../../shared/infrastructure/firebase/firebase-app';

const connectedEmulatorDatabases = new WeakSet<Firestore>();

function initializeFirestore(): Firestore {
  try {
    const { app, firestoreEmulatorUrl } = getFirebaseClient();
    const database = getFirestore(app);

    if (firestoreEmulatorUrl && !connectedEmulatorDatabases.has(database)) {
      const url = new URL(firestoreEmulatorUrl);
      connectFirestoreEmulator(database, url.hostname, Number(url.port));
      connectedEmulatorDatabases.add(database);
    }

    return database;
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
}

export function createFirebaseWorkoutSessionRepository(): WorkoutSessionRepository {
  return new FirebaseWorkoutSessionRepository();
}
