import type { WorkoutPlanExercise } from './workout-plan-exercise';

export const WORKOUT_PLAN_LIMITS = {
  defaultSets: { min: 1, max: 10 },
  order: { min: 1, max: 999 },
} as const;

export interface WorkoutExerciseDraft {
  readonly divisionId: string;
  readonly divisionNameSnapshot: string;
  readonly exerciseId: string;
  readonly exerciseDocumentId: string;
  readonly exerciseNameSnapshot: string;
  readonly defaultSets: number;
  readonly order: number;
}

export interface ExerciseOrderUpdate {
  readonly id: string;
  readonly divisionId: string;
  readonly documentId: string;
  readonly order: number;
}

export type WorkoutPlanRuleFailureCode =
  'division-required' | 'exercise-required' | 'invalid-default-sets' | 'invalid-order';

export class WorkoutPlanRuleError extends Error {
  constructor(readonly code: WorkoutPlanRuleFailureCode) {
    super(code);
    this.name = 'WorkoutPlanRuleError';
  }
}

export function validateWorkoutExerciseDraft(
  draft: WorkoutExerciseDraft,
): WorkoutExerciseDraft {
  const divisionId = draft.divisionId.trim();
  const divisionNameSnapshot = draft.divisionNameSnapshot.trim();
  const exerciseId = draft.exerciseId.trim();
  const exerciseDocumentId = draft.exerciseDocumentId.trim();
  const exerciseNameSnapshot = draft.exerciseNameSnapshot.trim();

  if (!divisionId || !divisionNameSnapshot) {
    throw new WorkoutPlanRuleError('division-required');
  }
  if (!exerciseId || !exerciseDocumentId || !exerciseNameSnapshot) {
    throw new WorkoutPlanRuleError('exercise-required');
  }
  if (
    !Number.isInteger(draft.defaultSets) ||
    draft.defaultSets < WORKOUT_PLAN_LIMITS.defaultSets.min ||
    draft.defaultSets > WORKOUT_PLAN_LIMITS.defaultSets.max
  ) {
    throw new WorkoutPlanRuleError('invalid-default-sets');
  }
  if (
    !Number.isInteger(draft.order) ||
    draft.order < WORKOUT_PLAN_LIMITS.order.min ||
    draft.order > WORKOUT_PLAN_LIMITS.order.max
  ) {
    throw new WorkoutPlanRuleError('invalid-order');
  }

  return {
    ...draft,
    divisionId,
    divisionNameSnapshot,
    exerciseId,
    exerciseDocumentId,
    exerciseNameSnapshot,
  };
}

export function hasDuplicateExercise(
  exercises: readonly WorkoutPlanExercise[],
  draft: Pick<WorkoutExerciseDraft, 'divisionId' | 'exerciseId'>,
  ignoredId?: string,
): boolean {
  return exercises.some(
    (exercise) =>
      exercise.id !== ignoredId &&
      exercise.divisionId === draft.divisionId &&
      exercise.exerciseId === draft.exerciseId,
  );
}

export function hasDuplicateOrder(
  exercises: readonly WorkoutPlanExercise[],
  draft: Pick<WorkoutExerciseDraft, 'divisionId' | 'order'>,
  ignoredId?: string,
): boolean {
  return exercises.some(
    (exercise) =>
      exercise.id !== ignoredId &&
      exercise.divisionId === draft.divisionId &&
      exercise.order === draft.order,
  );
}

export function sortWorkoutExercises(
  exercises: readonly WorkoutPlanExercise[],
): WorkoutPlanExercise[] {
  return [...exercises].sort(
    (left, right) =>
      left.divisionOrder - right.divisionOrder ||
      left.division.localeCompare(right.division, 'pt-BR', { sensitivity: 'base' }) ||
      left.order - right.order ||
      left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }) ||
      left.id.localeCompare(right.id),
  );
}

export function moveWorkoutExercise(
  exercises: readonly WorkoutPlanExercise[],
  exerciseId: string,
  direction: 'up' | 'down',
): ExerciseOrderUpdate[] {
  const exercise = exercises.find(({ id }) => id === exerciseId);
  if (!exercise) return [];

  const divisionExercises = sortWorkoutExercises(exercises).filter(
    ({ divisionId }) => divisionId === exercise.divisionId,
  );
  const currentIndex = divisionExercises.findIndex(({ id }) => id === exerciseId);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= divisionExercises.length) {
    return [];
  }

  const reordered = [...divisionExercises];
  const target = reordered[targetIndex];
  if (!target) return [];
  reordered[targetIndex] = exercise;
  reordered[currentIndex] = target;

  return reordered
    .map(({ id, divisionId, documentId }, index) => ({
      id,
      divisionId,
      documentId,
      order: index + 1,
    }))
    .filter(({ id, order }) => exercises.find((item) => item.id === id)?.order !== order);
}
