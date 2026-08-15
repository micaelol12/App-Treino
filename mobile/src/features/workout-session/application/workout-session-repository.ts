import type { CompletedWorkoutSession } from '../domain/workout-session-draft';

export interface WorkoutSessionRepository {
  complete(userId: string, session: CompletedWorkoutSession): Promise<void>;
}
