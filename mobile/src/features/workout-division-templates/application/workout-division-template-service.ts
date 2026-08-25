import type { WorkoutDivisionRepository } from '@/features/workout-divisions/application/workout-division-repository';
import {
  comparableDivisionName,
  validateWorkoutDivisionInput,
} from '@/features/workout-divisions/domain/workout-division';

import { WorkoutDivisionTemplateFailure } from './workout-division-template-failure';
import type { WorkoutDivisionTemplateRepository } from './workout-division-template-repository';

export class WorkoutDivisionTemplateService {
  constructor(
    private readonly templateRepository: WorkoutDivisionTemplateRepository,
    private readonly divisionRepository: WorkoutDivisionRepository,
  ) {}

  listPublished() {
    return this.templateRepository.listPublished();
  }

  getPublished(templateId: string) {
    return this.templateRepository.getPublished(templateId);
  }

  async importToUser(
    userId: string,
    templateId: string,
    requestedName: string,
  ): Promise<string> {
    const { name } = validateWorkoutDivisionInput({
      name: requestedName,
      active: true,
    });
    const divisions = await this.divisionRepository.list(userId);
    if (
      divisions.some(
        (division) =>
          comparableDivisionName(division.name) === comparableDivisionName(name),
      )
    ) {
      throw new WorkoutDivisionTemplateFailure('duplicate');
    }
    const template = await this.templateRepository.getPublished(templateId);
    if (!template.exercises.length) {
      throw new WorkoutDivisionTemplateFailure('unavailable');
    }
    const order = Math.max(0, ...divisions.map((division) => division.order)) + 1;
    return this.templateRepository.importToUser(userId, template, name, order);
  }
}
