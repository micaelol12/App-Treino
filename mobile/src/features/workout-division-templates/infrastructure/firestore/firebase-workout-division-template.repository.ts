import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { WorkoutDivisionTemplateFailure } from '../../application/workout-division-template-failure';
import type { WorkoutDivisionTemplateRepository } from '../../application/workout-division-template-repository';
import type { WorkoutDivisionTemplateDetails } from '../../domain/workout-division-template';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import {
  mapWorkoutDivisionTemplateDocument,
  mapWorkoutDivisionTemplateExerciseDocument,
} from './workout-division-template.mapper';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new WorkoutDivisionTemplateFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function mapFailure(error: unknown): WorkoutDivisionTemplateFailure {
  if (error instanceof WorkoutDivisionTemplateFailure) return error;
  if (error instanceof InvalidFirestoreDocumentError) {
    return new WorkoutDivisionTemplateFailure('invalid-data', { cause: error });
  }
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new WorkoutDivisionTemplateFailure('permission-denied', { cause: error });
    }
    if (error.code === 'not-found') {
      return new WorkoutDivisionTemplateFailure('not-found', { cause: error });
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return new WorkoutDivisionTemplateFailure('network', { cause: error });
    }
  }
  return new WorkoutDivisionTemplateFailure('unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}

export class FirebaseWorkoutDivisionTemplateRepository implements WorkoutDivisionTemplateRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async listPublished() {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.database, 'modelos_divisao'),
          where('status', '==', 'published'),
          orderBy('displayOrder', 'asc'),
        ),
      );
      return snapshot.docs.map((item) =>
        mapWorkoutDivisionTemplateDocument(item.id, item.data()),
      );
    } catch (error) {
      throw mapFailure(error);
    }
  }

  async getPublished(templateId: string): Promise<WorkoutDivisionTemplateDetails> {
    try {
      const reference = doc(this.database, 'modelos_divisao', templateId);
      const templateSnapshot = await getDoc(reference);
      if (!templateSnapshot.exists() || templateSnapshot.data().status !== 'published') {
        throw new WorkoutDivisionTemplateFailure('not-found');
      }
      const template = mapWorkoutDivisionTemplateDocument(
        templateSnapshot.id,
        templateSnapshot.data(),
      );
      const exerciseSnapshot = await getDocs(
        query(collection(reference, 'exercicios'), orderBy('order', 'asc')),
      );
      const exercises = exerciseSnapshot.docs.map((item) =>
        mapWorkoutDivisionTemplateExerciseDocument(item.id, item.data()),
      );
      if (exercises.length !== template.exerciseCount) {
        throw new WorkoutDivisionTemplateFailure('invalid-data');
      }
      return { ...template, exercises };
    } catch (error) {
      throw mapFailure(error);
    }
  }

  async importToUser(
    userId: string,
    requestedTemplate: WorkoutDivisionTemplateDetails,
    name: string,
    order: number,
  ): Promise<string> {
    try {
      const template = await this.getPublished(requestedTemplate.id);
      if (template.version !== requestedTemplate.version) {
        throw new WorkoutDivisionTemplateFailure('unavailable');
      }
      const divisionReference = doc(
        collection(this.database, `usuarios/${userId}/divisoes`),
      );
      const timestamp = serverTimestamp();
      const batch = writeBatch(this.database);
      batch.set(divisionReference, {
        name,
        order,
        active: true,
        schemaVersion: 2,
        sourceTemplateId: template.id,
        sourceTemplateVersion: template.version,
        importedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      for (const exercise of template.exercises) {
        batch.set(doc(divisionReference, 'exercicios', exercise.exerciseDocumentId), {
          exerciseId: exercise.exerciseId,
          exerciseDocumentId: exercise.exerciseDocumentId,
          exerciseNameSnapshot: exercise.exerciseNameSnapshot,
          defaultSets: exercise.defaultSets,
          order: exercise.order,
          active: true,
          schemaVersion: 2,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      await batch.commit();
      return divisionReference.id;
    } catch (error) {
      throw mapFailure(error);
    }
  }
}

export function createFirebaseWorkoutDivisionTemplateRepository() {
  return new FirebaseWorkoutDivisionTemplateRepository();
}
