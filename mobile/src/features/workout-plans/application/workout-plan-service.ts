import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import {
  hasDuplicateExercise,
  hasDuplicateOrder,
  moveWorkoutExercise,
  sortWorkoutExercises,
  type WorkoutExerciseDraft,
  validateWorkoutExerciseDraft,
} from '../domain/workout-plan-rules';

import { WorkoutPlanFailure } from './workout-plan-failure';
import type { WorkoutPlanRepository } from './workout-plan-repository';

export class WorkoutPlanService {
  constructor(private readonly repository: WorkoutPlanRepository) {}

  async list(userId: string): Promise<WorkoutPlanExercise[]> {
    return sortWorkoutExercises(await this.repository.list(userId));
  }

  async create(userId: string, draft: WorkoutExerciseDraft): Promise<string> {
    const normalizedDraft = validateWorkoutExerciseDraft(draft);
    const exercises = await this.repository.list(userId);

    if (hasDuplicateExercise(exercises, normalizedDraft)) {
      throw new WorkoutPlanFailure('duplicate');
    }
    if (hasDuplicateOrder(exercises, normalizedDraft)) {
      throw new WorkoutPlanFailure('duplicate-order');
    }

    return this.repository.create(userId, normalizedDraft);
  }

  async update(
    userId: string,
    exerciseId: string,
    draft: WorkoutExerciseDraft,
  ): Promise<void> {
    const normalizedDraft = validateWorkoutExerciseDraft(draft);
    const exercises = await this.repository.list(userId);

    if (!exercises.some(({ id }) => id === exerciseId)) {
      throw new WorkoutPlanFailure('not-found');
    }
    if (hasDuplicateExercise(exercises, normalizedDraft, exerciseId)) {
      throw new WorkoutPlanFailure('duplicate');
    }
    if (hasDuplicateOrder(exercises, normalizedDraft, exerciseId)) {
      throw new WorkoutPlanFailure('duplicate-order');
    }

    await this.repository.update(userId, exerciseId, normalizedDraft);
  }

  async delete(userId: string, exerciseId: string): Promise<void> {
    await this.repository.delete(userId, exerciseId);
  }

  async move(
    userId: string,
    exerciseId: string,
    direction: 'up' | 'down',
  ): Promise<void> {
    const exercises = await this.repository.list(userId);
    if (!exercises.some(({ id }) => id === exerciseId)) {
      throw new WorkoutPlanFailure('not-found');
    }

    const updates = moveWorkoutExercise(exercises, exerciseId, direction);
    if (updates.length) await this.repository.updateOrder(userId, updates);
  }
}
