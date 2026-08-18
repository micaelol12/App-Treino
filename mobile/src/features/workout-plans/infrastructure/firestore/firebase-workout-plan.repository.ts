import { FirebaseError } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { WorkoutPlanFailure } from '../../application/workout-plan-failure';
import type { WorkoutPlanRepository } from '../../application/workout-plan-repository';
import type { WorkoutPlanExercise } from '../../domain/workout-plan-exercise';
import type {
  ExerciseOrderUpdate,
  WorkoutExerciseDraft,
} from '../../domain/workout-plan-rules';
import { mapWorkoutDivisionDocument } from '@/features/workout-divisions/infrastructure/firestore/workout-division.mapper';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { mapWorkoutConfigDocument } from './workout-config.mapper';
import { mapWorkoutPlanItemDocument } from './workout-plan-item.mapper';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new WorkoutPlanFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function divisionsPath(userId: string): string {
  return `usuarios/${userId}/divisoes`;
}

function itemsPath(userId: string, divisionId: string): string {
  return `${divisionsPath(userId)}/${divisionId}/exercicios`;
}

function legacyPath(userId: string): string {
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

function toDocument(draft: WorkoutExerciseDraft) {
  return {
    exerciseId: draft.exerciseId,
    exerciseDocumentId: draft.exerciseDocumentId,
    exerciseNameSnapshot: draft.exerciseNameSnapshot,
    defaultSets: draft.defaultSets,
    order: draft.order,
    active: true,
    schemaVersion: 2 as const,
  };
}

export class FirebaseWorkoutPlanRepository implements WorkoutPlanRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async list(userId: string): Promise<WorkoutPlanExercise[]> {
    try {
      const [divisionSnapshot, migrationMarker] = await Promise.all([
        getDocs(collection(this.database, divisionsPath(userId))),
        getDoc(doc(this.database, `usuarios/${userId}/migracoes/workout-plan-v2`)),
      ]);
      if (divisionSnapshot.empty) {
        const legacySnapshot = await getDocs(
          collection(this.database, legacyPath(userId)),
        );
        return legacySnapshot.docs.map((item) =>
          mapWorkoutConfigDocument(item.id, item.data()),
        );
      }

      const divisions = divisionSnapshot.docs.map((item) =>
        mapWorkoutDivisionDocument(item.id, item.data()),
      );
      const groups = await Promise.all(
        divisions.map(async (division) => {
          const snapshot = await getDocs(
            collection(this.database, itemsPath(userId, division.id)),
          );
          return snapshot.docs
            .map((item) => mapWorkoutPlanItemDocument(division, item.id, item.data()))
            .filter((item): item is WorkoutPlanExercise => item !== null);
        }),
      );
      const versioned = groups.flat();
      if (migrationMarker.data()?.status === 'complete') return versioned;

      const legacySnapshot = await getDocs(collection(this.database, legacyPath(userId)));
      return [
        ...versioned,
        ...legacySnapshot.docs.map((item) =>
          mapWorkoutConfigDocument(item.id, item.data()),
        ),
      ];
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async create(userId: string, draft: WorkoutExerciseDraft): Promise<string> {
    try {
      const timestamp = serverTimestamp();
      await setDoc(
        doc(this.database, itemsPath(userId, draft.divisionId), draft.exerciseDocumentId),
        { ...toDocument(draft), createdAt: timestamp, updatedAt: timestamp },
      );
      return `${draft.divisionId}__${draft.exerciseDocumentId}`;
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async update(
    userId: string,
    exercise: WorkoutPlanExercise,
    draft: WorkoutExerciseDraft,
  ): Promise<void> {
    if (exercise.sourceSchemaVersion !== 2) {
      throw new WorkoutPlanFailure('not-found');
    }
    try {
      const oldReference = doc(
        this.database,
        itemsPath(userId, exercise.divisionId),
        exercise.documentId,
      );
      const newReference = doc(
        this.database,
        itemsPath(userId, draft.divisionId),
        draft.exerciseDocumentId,
      );
      const timestamp = serverTimestamp();
      const moved = oldReference.path !== newReference.path;

      if (!moved) {
        await setDoc(
          newReference,
          { ...toDocument(draft), updatedAt: timestamp },
          { merge: true },
        );
        return;
      }

      const batch = writeBatch(this.database);
      batch.delete(oldReference);
      batch.set(newReference, {
        ...toDocument(draft),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await batch.commit();
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async delete(userId: string, exercise: WorkoutPlanExercise): Promise<void> {
    if (exercise.sourceSchemaVersion !== 2) {
      throw new WorkoutPlanFailure('not-found');
    }
    try {
      await deleteDoc(
        doc(this.database, itemsPath(userId, exercise.divisionId), exercise.documentId),
      );
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
        batch.update(
          doc(this.database, itemsPath(userId, update.divisionId), update.documentId),
          { order: update.order, schemaVersion: 2, updatedAt: serverTimestamp() },
        );
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
