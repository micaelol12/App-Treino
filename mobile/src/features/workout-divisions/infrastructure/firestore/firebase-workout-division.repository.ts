import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

import { WorkoutDivisionFailure } from '../../application/workout-division-failure';
import type { WorkoutDivisionRepository } from '../../application/workout-division-repository';
import {
  sortWorkoutDivisions,
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
}

export function createFirebaseWorkoutDivisionRepository(): WorkoutDivisionRepository {
  return new FirebaseWorkoutDivisionRepository();
}
