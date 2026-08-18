import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import type {
  ExerciseOrderUpdate,
  WorkoutExerciseDraft,
} from '../domain/workout-plan-rules';

export interface WorkoutPlanRepository {
  list(userId: string): Promise<WorkoutPlanExercise[]>;
  create(userId: string, draft: WorkoutExerciseDraft): Promise<string>;
  update(
    userId: string,
    exercise: WorkoutPlanExercise,
    draft: WorkoutExerciseDraft,
  ): Promise<void>;
  delete(userId: string, exercise: WorkoutPlanExercise): Promise<void>;
  updateOrder(userId: string, updates: readonly ExerciseOrderUpdate[]): Promise<void>;
}
