import { FirebaseError } from 'firebase/app';
import { collection, getDocs, type Firestore } from 'firebase/firestore';
import { z } from 'zod';

import { ExerciseCatalogFailure } from '../../application/exercise-catalog-failure';
import {
  exerciseTaxonomyNames,
  type ExerciseCatalogSnapshot,
  type ExerciseTaxonomies,
  type ExerciseTaxonomyName,
} from '../../application/exercise-catalog-repository';
import { sortExercises } from '../../domain/exercise';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import type { ExerciseCatalogRemoteDataSource } from '../cached-exercise-catalog.repository';
import { mapExerciseDocument } from './exercise.mapper';

const taxonomySchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    active: z.boolean(),
    order: z.number().int().nonnegative(),
  })
  .strip();

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

export class FirebaseExerciseCatalogDataSource implements ExerciseCatalogRemoteDataSource {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async download(): Promise<ExerciseCatalogSnapshot> {
    try {
      const [exerciseSnapshot, ...taxonomySnapshots] = await Promise.all([
        getDocs(collection(this.database, 'exercicios')),
        ...exerciseTaxonomyNames.map((name) => getDocs(collection(this.database, name))),
      ]);
      const taxonomies = Object.fromEntries(
        exerciseTaxonomyNames.map((name, index) => [
          name,
          taxonomySnapshots[index]!.docs.map((item) =>
            taxonomySchema.parse(item.data()),
          ).sort(
            (left, right) =>
              left.order - right.order ||
              left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }),
          ),
        ]),
      ) as unknown as Record<
        ExerciseTaxonomyName,
        ExerciseTaxonomies[ExerciseTaxonomyName]
      >;
      return {
        exercises: sortExercises(
          exerciseSnapshot.docs.map((item) => mapExerciseDocument(item.id, item.data())),
        ),
        taxonomies,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw mapFailure(error);
    }
  }
}

export function createFirebaseExerciseCatalogDataSource(): ExerciseCatalogRemoteDataSource {
  return new FirebaseExerciseCatalogDataSource();
}
