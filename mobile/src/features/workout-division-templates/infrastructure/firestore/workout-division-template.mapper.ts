import type {
  WorkoutDivisionTemplate,
  WorkoutDivisionTemplateExercise,
} from '../../domain/workout-division-template';
import { parseFirestoreDocument } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import {
  workoutDivisionTemplateDocumentSchema,
  workoutDivisionTemplateExerciseDocumentSchema,
} from './workout-division-template.schema';

export function mapWorkoutDivisionTemplateDocument(
  documentId: string,
  data: unknown,
): WorkoutDivisionTemplate {
  const document = parseFirestoreDocument(
    workoutDivisionTemplateDocumentSchema,
    'modelos_divisao',
    documentId,
    data,
  );
  return {
    id: documentId,
    name: document.name,
    description: document.description,
    level: document.level,
    goal: document.goal,
    displayOrder: document.displayOrder,
    exerciseCount: document.exerciseCount,
    version: document.version,
  };
}

export function mapWorkoutDivisionTemplateExerciseDocument(
  documentId: string,
  data: unknown,
): WorkoutDivisionTemplateExercise {
  const document = parseFirestoreDocument(
    workoutDivisionTemplateExerciseDocumentSchema,
    'modelos_divisao/*/exercicios',
    documentId,
    data,
  );
  return {
    exerciseId: document.exerciseId,
    exerciseDocumentId: document.exerciseDocumentId,
    exerciseNameSnapshot: document.exerciseNameSnapshot,
    defaultSets: document.defaultSets,
    order: document.order,
  };
}
