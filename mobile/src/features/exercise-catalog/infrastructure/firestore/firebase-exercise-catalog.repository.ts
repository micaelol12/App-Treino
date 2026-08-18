import { FirebaseError } from 'firebase/app';
import { collection, getDocs, type Firestore } from 'firebase/firestore';

import { ExerciseCatalogFailure } from '../../application/exercise-catalog-failure';
import type { ExerciseCatalogRepository } from '../../application/exercise-catalog-repository';
import { sortExercises } from '../../domain/exercise';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { mapExerciseDocument } from './exercise.mapper';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new ExerciseCatalogFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function mapFailure(error: unknown): ExerciseCatalogFailure {
  if (error instanceof ExerciseCatalogFailure) return error;
  if (error instanceof InvalidFirestoreDocumentError) {
    return new ExerciseCatalogFailure('invalid-data', { cause: error });
  }
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new ExerciseCatalogFailure('permission-denied', { cause: error });
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return new ExerciseCatalogFailure('network', { cause: error });
    }
  }
  return new ExerciseCatalogFailure('unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}

export class FirebaseExerciseCatalogRepository implements ExerciseCatalogRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async list() {
    try {
      const snapshot = await getDocs(collection(this.database, 'exercicios'));
      return sortExercises(
        snapshot.docs.map((item) => mapExerciseDocument(item.id, item.data())),
      );
    } catch (error) {
      throw mapFailure(error);
    }
  }
}

export function createFirebaseExerciseCatalogRepository(): ExerciseCatalogRepository {
  return new FirebaseExerciseCatalogRepository();
}
