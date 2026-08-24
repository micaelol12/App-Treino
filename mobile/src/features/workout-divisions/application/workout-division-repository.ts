import type {
  DivisionOrderUpdate,
  WorkoutDivision,
  WorkoutDivisionDraft,
} from '../domain/workout-division';

export interface WorkoutDivisionRepository {
  list(userId: string): Promise<readonly WorkoutDivision[]>;
  create(userId: string, draft: WorkoutDivisionDraft): Promise<string>;
  delete(userId: string, divisionId: string): Promise<void>;
  update(userId: string, divisionId: string, draft: WorkoutDivisionDraft): Promise<void>;
  updateOrder(userId: string, updates: readonly DivisionOrderUpdate[]): Promise<void>;
}
