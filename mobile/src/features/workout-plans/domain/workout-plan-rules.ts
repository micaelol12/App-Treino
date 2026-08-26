import type { WorkoutPlanExercise } from './workout-plan-exercise';

export const WORKOUT_PLAN_LIMITS = {
  defaultSets: { min: 1, max: 10 },
  order: { min: 1, max: 999 },
} as const;

export interface WorkoutExerciseInput {
  readonly divisionId: string;
  readonly divisionNameSnapshot: string;
  readonly exerciseId: string;
  readonly exerciseDocumentId: string;
  readonly exerciseNameSnapshot: string;
  readonly defaultSets: number;
}

export interface WorkoutExerciseDraft extends WorkoutExerciseInput {
  readonly order: number;
}

export interface ExerciseOrderUpdate {
  readonly id: string;
  readonly divisionId: string;
  readonly documentId: string;
  readonly order: number;
}

export type WorkoutPlanRuleFailureCode =
  | 'division-required'
  | 'exercise-required'
  | 'invalid-default-sets'
  | 'invalid-order'
  | 'invalid-sequence';

export class WorkoutPlanRuleError extends Error {
  constructor(readonly code: WorkoutPlanRuleFailureCode) {
    super(code);
    this.name = 'WorkoutPlanRuleError';
  }
}

export function validateWorkoutExerciseDraft(
  draft: WorkoutExerciseDraft,
): WorkoutExerciseDraft {
  const input = validateWorkoutExerciseInput(draft);

  if (
    !Number.isInteger(draft.order) ||
    draft.order < WORKOUT_PLAN_LIMITS.order.min ||
    draft.order > WORKOUT_PLAN_LIMITS.order.max
  ) {
    throw new WorkoutPlanRuleError('invalid-order');
  }

  return { ...input, order: draft.order };
}

export function validateWorkoutExerciseInput(
  input: WorkoutExerciseInput,
): WorkoutExerciseInput {
  const divisionId = input.divisionId.trim();
  const divisionNameSnapshot = input.divisionNameSnapshot.trim();
  const exerciseId = input.exerciseId.trim();
  const exerciseDocumentId = input.exerciseDocumentId.trim();
  const exerciseNameSnapshot = input.exerciseNameSnapshot.trim();

  if (!divisionId || !divisionNameSnapshot) {
    throw new WorkoutPlanRuleError('division-required');
  }
  if (!exerciseId || !exerciseDocumentId || !exerciseNameSnapshot) {
    throw new WorkoutPlanRuleError('exercise-required');
  }
  if (
    !Number.isInteger(input.defaultSets) ||
    input.defaultSets < WORKOUT_PLAN_LIMITS.defaultSets.min ||
    input.defaultSets > WORKOUT_PLAN_LIMITS.defaultSets.max
  ) {
    throw new WorkoutPlanRuleError('invalid-default-sets');
  }

  return {
    ...input,
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

export function reorderWorkoutExercises(
  exercises: readonly WorkoutPlanExercise[],
  divisionId: string,
  orderedExerciseIds: readonly string[],
  includeUnchanged = false,
): ExerciseOrderUpdate[] {
  const divisionExercises = sortWorkoutExercises(exercises).filter(
    (exercise) => exercise.divisionId === divisionId,
  );
  const currentIds = new Set(divisionExercises.map(({ id }) => id));
  const orderedIds = new Set(orderedExerciseIds);
  if (
    divisionExercises.some(({ sourceSchemaVersion }) => sourceSchemaVersion < 2) ||
    orderedExerciseIds.length !== divisionExercises.length ||
    orderedIds.size !== orderedExerciseIds.length ||
    currentIds.size !== orderedIds.size ||
    [...currentIds].some((id) => !orderedIds.has(id))
  ) {
    throw new WorkoutPlanRuleError('invalid-sequence');
  }

  const byId = new Map(divisionExercises.map((exercise) => [exercise.id, exercise]));
  return orderedExerciseIds
    .map((id, index) => ({
      id,
      divisionId,
      documentId: byId.get(id)?.documentId ?? '',
      order: index + 1,
    }))
    .filter(({ id, order }) => includeUnchanged || byId.get(id)?.order !== order);
}
