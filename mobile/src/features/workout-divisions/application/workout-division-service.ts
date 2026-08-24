import {
  comparableDivisionName,
  reorderWorkoutDivisions,
  sortWorkoutDivisions,
  validateWorkoutDivisionDraft,
  validateWorkoutDivisionInput,
  type WorkoutDivision,
  type WorkoutDivisionInput,
} from '../domain/workout-division';

import { WorkoutDivisionFailure } from './workout-division-failure';
import type { WorkoutDivisionRepository } from './workout-division-repository';

export class WorkoutDivisionService {
  constructor(private readonly repository: WorkoutDivisionRepository) {}

  async list(userId: string): Promise<WorkoutDivision[]> {
    return sortWorkoutDivisions(await this.repository.list(userId));
  }

  async create(userId: string, input: WorkoutDivisionInput): Promise<string> {
    const normalizedInput = validateWorkoutDivisionInput(input);
    const divisions = await this.repository.list(userId);
    this.assertUniqueName(divisions, normalizedInput);
    const draft = validateWorkoutDivisionDraft({
      ...normalizedInput,
      order: Math.max(0, ...divisions.map(({ order }) => order)) + 1,
    });
    return this.repository.create(userId, draft);
  }

  async update(
    userId: string,
    divisionId: string,
    input: WorkoutDivisionInput,
  ): Promise<void> {
    const normalizedInput = validateWorkoutDivisionInput(input);
    const divisions = await this.repository.list(userId);
    const division = divisions.find(({ id }) => id === divisionId);
    if (!division) {
      throw new WorkoutDivisionFailure('not-found');
    }
    this.assertUniqueName(divisions, normalizedInput, divisionId);
    await this.repository.update(
      userId,
      divisionId,
      validateWorkoutDivisionDraft({ ...normalizedInput, order: division.order }),
    );
  }

  async remove(userId: string, divisionId: string): Promise<void> {
    const divisions = await this.repository.list(userId);
    if (!divisions.some(({ id }) => id === divisionId)) {
      throw new WorkoutDivisionFailure('not-found');
    }
    await this.repository.delete(userId, divisionId);
  }

  async reorder(userId: string, orderedDivisionIds: readonly string[]): Promise<void> {
    const updates = reorderWorkoutDivisions(
      await this.repository.list(userId),
      orderedDivisionIds,
    );
    if (updates.length) await this.repository.updateOrder(userId, updates);
  }

  private assertUniqueName(
    divisions: readonly WorkoutDivision[],
    input: WorkoutDivisionInput,
    ignoredId?: string,
  ) {
    if (
      divisions.some(
        (division) =>
          division.id !== ignoredId &&
          comparableDivisionName(division.name) === comparableDivisionName(input.name),
      )
    ) {
      throw new WorkoutDivisionFailure('duplicate');
    }
  }
}
