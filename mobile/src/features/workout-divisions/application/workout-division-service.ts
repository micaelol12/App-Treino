import {
  comparableDivisionName,
  sortWorkoutDivisions,
  validateWorkoutDivisionDraft,
  type WorkoutDivision,
  type WorkoutDivisionDraft,
} from '../domain/workout-division';

import { WorkoutDivisionFailure } from './workout-division-failure';
import type { WorkoutDivisionRepository } from './workout-division-repository';

export class WorkoutDivisionService {
  constructor(private readonly repository: WorkoutDivisionRepository) {}

  async list(userId: string): Promise<WorkoutDivision[]> {
    return sortWorkoutDivisions(await this.repository.list(userId));
  }

  async create(userId: string, draft: WorkoutDivisionDraft): Promise<string> {
    const normalized = validateWorkoutDivisionDraft(draft);
    const divisions = await this.repository.list(userId);
    this.assertUnique(divisions, normalized);
    return this.repository.create(userId, normalized);
  }

  async update(
    userId: string,
    divisionId: string,
    draft: WorkoutDivisionDraft,
  ): Promise<void> {
    const normalized = validateWorkoutDivisionDraft(draft);
    const divisions = await this.repository.list(userId);
    if (!divisions.some(({ id }) => id === divisionId)) {
      throw new WorkoutDivisionFailure('not-found');
    }
    this.assertUnique(divisions, normalized, divisionId);
    await this.repository.update(userId, divisionId, normalized);
  }

  private assertUnique(
    divisions: readonly WorkoutDivision[],
    draft: WorkoutDivisionDraft,
    ignoredId?: string,
  ) {
    if (
      divisions.some(
        (division) =>
          division.id !== ignoredId &&
          comparableDivisionName(division.name) === comparableDivisionName(draft.name),
      )
    ) {
      throw new WorkoutDivisionFailure('duplicate');
    }
    if (
      divisions.some(
        (division) => division.id !== ignoredId && division.order === draft.order,
      )
    ) {
      throw new WorkoutDivisionFailure('duplicate-order');
    }
  }
}
