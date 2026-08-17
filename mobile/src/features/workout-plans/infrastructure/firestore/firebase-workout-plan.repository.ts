import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { WorkoutPlanFailure } from '../../application/workout-plan-failure';
import type { WorkoutPlanRepository } from '../../application/workout-plan-repository';
import type {
  ExerciseOrderUpdate,
  WorkoutExerciseDraft,
} from '../../domain/workout-plan-rules';
import { InvalidFirestoreDocumentError } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';
import { getFirebaseFirestore } from '../../../../shared/infrastructure/firebase/firebase-firestore';

import { mapWorkoutConfigDocument } from './workout-config.mapper';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new WorkoutPlanFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function collectionPath(userId: string): string {
  return `usuarios/${userId}/config_treinos`;
}

function mapFirestoreFailure(error: unknown): WorkoutPlanFailure {
  if (error instanceof WorkoutPlanFailure) return error;
  if (error instanceof InvalidFirestoreDocumentError) {
    return new WorkoutPlanFailure('invalid-data', { cause: error });
  }
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new WorkoutPlanFailure('permission-denied', { cause: error });
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return new WorkoutPlanFailure('network', { cause: error });
    }
    if (error.code === 'not-found') {
      return new WorkoutPlanFailure('not-found', { cause: error });
    }
  }

  return new WorkoutPlanFailure('unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}

function toFirestoreDocument(draft: WorkoutExerciseDraft) {
  return {
    Divisao: draft.division,
    Exercicio: draft.name,
    Series_Padrao: draft.defaultSets,
    Ordem: draft.order,
    schemaVersion: 1 as const,
  };
}

export class FirebaseWorkoutPlanRepository implements WorkoutPlanRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async list(userId: string) {
    try {
      const snapshot = await getDocs(collection(this.database, collectionPath(userId)));
      return snapshot.docs.map((item) => mapWorkoutConfigDocument(item.id, item.data()));
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async create(userId: string, draft: WorkoutExerciseDraft): Promise<string> {
    try {
      const timestamp = serverTimestamp();
      const reference = await addDoc(collection(this.database, collectionPath(userId)), {
        ...toFirestoreDocument(draft),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return reference.id;
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async update(
    userId: string,
    exerciseId: string,
    draft: WorkoutExerciseDraft,
  ): Promise<void> {
    try {
      await updateDoc(doc(this.database, collectionPath(userId), exerciseId), {
        ...toFirestoreDocument(draft),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async delete(userId: string, exerciseId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.database, collectionPath(userId), exerciseId));
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async updateOrder(
    userId: string,
    updates: readonly ExerciseOrderUpdate[],
  ): Promise<void> {
    if (!updates.length) return;

    try {
      const batch = writeBatch(this.database);
      for (const update of updates) {
        batch.update(doc(this.database, collectionPath(userId), update.id), {
          Ordem: update.order,
          schemaVersion: 1,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }
}

export function createFirebaseWorkoutPlanRepository(): WorkoutPlanRepository {
  return new FirebaseWorkoutPlanRepository();
}
