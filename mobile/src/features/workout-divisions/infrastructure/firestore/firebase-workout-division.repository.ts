import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { WorkoutDivisionFailure } from '../../application/workout-division-failure';
import type { WorkoutDivisionRepository } from '../../application/workout-division-repository';
import {
  sortWorkoutDivisions,
  type DivisionOrderUpdate,
  type WorkoutDivisionDraft,
} from '../../domain/workout-division';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { mapWorkoutDivisionDocument } from './workout-division.mapper';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new WorkoutDivisionFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function collectionPath(userId: string): string {
  return `usuarios/${userId}/divisoes`;
}

function exercisesPath(userId: string, divisionId: string): string {
  return `${collectionPath(userId)}/${divisionId}/exercicios`;
}

function mapFailure(error: unknown): WorkoutDivisionFailure {
  if (error instanceof WorkoutDivisionFailure) return error;
  if (error instanceof InvalidFirestoreDocumentError) {
    return new WorkoutDivisionFailure('invalid-data', { cause: error });
  }
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new WorkoutDivisionFailure('permission-denied', { cause: error });
    }
    if (error.code === 'not-found') {
      return new WorkoutDivisionFailure('not-found', { cause: error });
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return new WorkoutDivisionFailure('network', { cause: error });
    }
  }
  return new WorkoutDivisionFailure('unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}

function toDocument(draft: WorkoutDivisionDraft) {
  return { ...draft, schemaVersion: 2 as const };
}

export class FirebaseWorkoutDivisionRepository implements WorkoutDivisionRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async list(userId: string) {
    try {
      const snapshot = await getDocs(collection(this.database, collectionPath(userId)));
      return sortWorkoutDivisions(
        snapshot.docs.map((item) => mapWorkoutDivisionDocument(item.id, item.data())),
      );
    } catch (error) {
      throw mapFailure(error);
    }
  }

  async create(userId: string, draft: WorkoutDivisionDraft): Promise<string> {
    try {
      const timestamp = serverTimestamp();
      const reference = await addDoc(collection(this.database, collectionPath(userId)), {
        ...toDocument(draft),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return reference.id;
    } catch (error) {
      throw mapFailure(error);
    }
  }

  async delete(userId: string, divisionId: string): Promise<void> {
    try {
      const snapshot = await getDocs(
        collection(this.database, exercisesPath(userId, divisionId)),
      );
      let remainingReferences = snapshot.docs.map((item) => item.ref);

      // O documento pai é excluído apenas no último lote. Se um lote anterior falhar,
      // a divisão continua visível e a operação pode ser repetida sem deixar filhos órfãos.
      while (remainingReferences.length > 499) {
        const batch = writeBatch(this.database);
        for (const reference of remainingReferences.slice(0, 500)) {
          batch.delete(reference);
        }
        await batch.commit();
        remainingReferences = remainingReferences.slice(500);
      }

      const finalBatch = writeBatch(this.database);
      for (const reference of remainingReferences) finalBatch.delete(reference);
      finalBatch.delete(doc(this.database, collectionPath(userId), divisionId));
      await finalBatch.commit();
    } catch (error) {
      throw mapFailure(error);
    }
  }

  async update(
    userId: string,
    divisionId: string,
    draft: WorkoutDivisionDraft,
  ): Promise<void> {
    try {
      await updateDoc(doc(this.database, collectionPath(userId), divisionId), {
        ...toDocument(draft),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw mapFailure(error);
    }
  }

  async updateOrder(
    userId: string,
    updates: readonly DivisionOrderUpdate[],
  ): Promise<void> {
    if (!updates.length) return;
    try {
      const batch = writeBatch(this.database);
      const timestamp = serverTimestamp();
      for (const update of updates) {
        batch.update(doc(this.database, collectionPath(userId), update.id), {
          order: update.order,
          schemaVersion: 2,
          updatedAt: timestamp,
        });
      }
      await batch.commit();
    } catch (error) {
      throw mapFailure(error);
    }
  }
}

export function createFirebaseWorkoutDivisionRepository(): WorkoutDivisionRepository {
  return new FirebaseWorkoutDivisionRepository();
}
