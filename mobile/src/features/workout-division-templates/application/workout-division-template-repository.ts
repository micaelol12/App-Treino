import type {
  WorkoutDivisionTemplate,
  WorkoutDivisionTemplateDetails,
} from '../domain/workout-division-template';

export interface WorkoutDivisionTemplateRepository {
  listPublished(): Promise<readonly WorkoutDivisionTemplate[]>;
  getPublished(templateId: string): Promise<WorkoutDivisionTemplateDetails>;
  importToUser(
    userId: string,
    template: WorkoutDivisionTemplateDetails,
    name: string,
    order: number,
  ): Promise<string>;
}
