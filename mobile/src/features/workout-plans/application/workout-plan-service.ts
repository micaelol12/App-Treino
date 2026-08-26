import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import {
  hasDuplicateExercise,
  hasDuplicateOrder,
  reorderWorkoutExercises,
  sortWorkoutExercises,
  type WorkoutExerciseInput,
  validateWorkoutExerciseDraft,
  validateWorkoutExerciseInput,
} from '../domain/workout-plan-rules';

import { WorkoutPlanFailure } from './workout-plan-failure';
import type { WorkoutPlanRepository } from './workout-plan-repository';

export class WorkoutPlanService {
  constructor(private readonly repository: WorkoutPlanRepository) {}

  async list(userId: string): Promise<WorkoutPlanExercise[]> {
    return sortWorkoutExercises(await this.repository.list(userId));
  }

  async create(userId: string, input: WorkoutExerciseInput): Promise<string> {
    const normalizedInput = validateWorkoutExerciseInput(input);
    const exercises = await this.repository.list(userId);

    if (hasDuplicateExercise(exercises, normalizedInput)) {
      throw new WorkoutPlanFailure('duplicate');
    }
    const normalizedDraft = validateWorkoutExerciseDraft({
      ...normalizedInput,
      order:
        Math.max(
          0,
          ...exercises
            .filter(({ divisionId }) => divisionId === normalizedInput.divisionId)
            .map(({ order }) => order),
        ) + 1,
    });
    if (hasDuplicateOrder(exercises, normalizedDraft)) {
      throw new WorkoutPlanFailure('duplicate-order');
    }

    return this.repository.create(userId, normalizedDraft);
  }

  async update(
    userId: string,
    exerciseId: string,
    input: WorkoutExerciseInput,
  ): Promise<void> {
    const normalizedInput = validateWorkoutExerciseInput(input);
    const exercises = await this.repository.list(userId);

    const exercise = exercises.find(({ id }) => id === exerciseId);
    if (!exercise) {
      throw new WorkoutPlanFailure('not-found');
    }
    if (hasDuplicateExercise(exercises, normalizedInput, exerciseId)) {
      throw new WorkoutPlanFailure('duplicate');
    }
    const normalizedDraft = validateWorkoutExerciseDraft({
      ...normalizedInput,
      order:
        exercise.divisionId === normalizedInput.divisionId
          ? exercise.order
          : Math.max(
              0,
              ...exercises
                .filter(({ divisionId }) => divisionId === normalizedInput.divisionId)
                .map(({ order }) => order),
            ) + 1,
    });
    if (hasDuplicateOrder(exercises, normalizedDraft, exerciseId)) {
      throw new WorkoutPlanFailure('duplicate-order');
    }

    await this.repository.update(userId, exercise, normalizedDraft);
  }

  async delete(userId: string, exerciseId: string): Promise<void> {
    const exercise = (await this.repository.list(userId)).find(
      ({ id }) => id === exerciseId,
    );
    if (!exercise) throw new WorkoutPlanFailure('not-found');
    await this.repository.delete(userId, exercise);
  }

  async reorder(
    userId: string,
    divisionId: string,
    orderedExerciseIds: readonly string[],
    cachedExercises?: readonly WorkoutPlanExercise[],
  ): Promise<void> {
    const exercises = cachedExercises ?? (await this.repository.list(userId));
    const updates = reorderWorkoutExercises(
      exercises,
      divisionId,
      orderedExerciseIds,
      cachedExercises !== undefined,
    );
    if (updates.length) await this.repository.updateOrder(userId, updates);
  }
}
