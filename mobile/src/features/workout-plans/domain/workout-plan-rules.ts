import type { WorkoutPlanExercise } from './workout-plan-exercise';

export const WORKOUT_PLAN_LIMITS = {
  divisionLength: 80,
  exerciseNameLength: 120,
  defaultSets: { min: 1, max: 10 },
  order: { min: 1, max: 999 },
} as const;

export interface WorkoutExerciseDraft {
  readonly division: string;
  readonly name: string;
  readonly defaultSets: number;
  readonly order: number;
}

export interface ExerciseOrderUpdate {
  readonly id: string;
  readonly order: number;
}

export type WorkoutPlanRuleFailureCode =
  | 'division-required'
  | 'division-too-long'
  | 'name-required'
  | 'name-too-long'
  | 'invalid-default-sets'
  | 'invalid-order';

export class WorkoutPlanRuleError extends Error {
  constructor(readonly code: WorkoutPlanRuleFailureCode) {
    super(code);
    this.name = 'WorkoutPlanRuleError';
  }
}

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function comparableLabel(value: string): string {
  return normalizeLabel(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function validateWorkoutExerciseDraft(
  draft: WorkoutExerciseDraft,
): WorkoutExerciseDraft {
  const division = normalizeLabel(draft.division);
  const name = normalizeLabel(draft.name);

  if (!division) throw new WorkoutPlanRuleError('division-required');
  if (division.length > WORKOUT_PLAN_LIMITS.divisionLength) {
    throw new WorkoutPlanRuleError('division-too-long');
  }
  if (!name) throw new WorkoutPlanRuleError('name-required');
  if (name.length > WORKOUT_PLAN_LIMITS.exerciseNameLength) {
    throw new WorkoutPlanRuleError('name-too-long');
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

  return { ...draft, division, name };
}

export function hasDuplicateExercise(
  exercises: readonly WorkoutPlanExercise[],
  draft: Pick<WorkoutExerciseDraft, 'division' | 'name'>,
  ignoredId?: string,
): boolean {
  const division = comparableLabel(draft.division);
  const name = comparableLabel(draft.name);

  return exercises.some(
    (exercise) =>
      exercise.id !== ignoredId &&
      comparableLabel(exercise.division) === division &&
      comparableLabel(exercise.name) === name,
  );
}

export function hasDuplicateOrder(
  exercises: readonly WorkoutPlanExercise[],
  draft: Pick<WorkoutExerciseDraft, 'division' | 'order'>,
  ignoredId?: string,
): boolean {
  const division = comparableLabel(draft.division);

  return exercises.some(
    (exercise) =>
      exercise.id !== ignoredId &&
      comparableLabel(exercise.division) === division &&
      exercise.order === draft.order,
  );
}

export function sortWorkoutExercises(
  exercises: readonly WorkoutPlanExercise[],
): WorkoutPlanExercise[] {
  return [...exercises].sort(
    (left, right) =>
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
    ({ division }) => comparableLabel(division) === comparableLabel(exercise.division),
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
    .map(({ id }, index) => ({ id, order: index + 1 }))
    .filter(({ id, order }) => exercises.find((item) => item.id === id)?.order !== order);
}
