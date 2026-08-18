import type { WorkoutDivision, WorkoutDivisionDraft } from '../domain/workout-division';

export interface WorkoutDivisionRepository {
  list(userId: string): Promise<readonly WorkoutDivision[]>;
  create(userId: string, draft: WorkoutDivisionDraft): Promise<string>;
  update(userId: string, divisionId: string, draft: WorkoutDivisionDraft): Promise<void>;
}
