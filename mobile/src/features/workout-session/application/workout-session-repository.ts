import type { CompletedWorkoutSession } from '../domain/workout-session-draft';
import type { WorkoutHistoryUpdate } from '../domain/workout-history';
import type { WorkoutSetRecord } from '../domain/workout-set-record';

export interface WorkoutHistoryPageCursor {
  readonly id: string;
  readonly performedOn: string;
}

export interface WorkoutHistoryPage {
  readonly records: readonly WorkoutSetRecord[];
  readonly nextCursor: WorkoutHistoryPageCursor | null;
}

export interface WorkoutSessionRepository {
  complete(userId: string, session: CompletedWorkoutSession): Promise<void>;
  listHistoryPage(
    userId: string,
    pageSize: number,
    cursor?: WorkoutHistoryPageCursor,
  ): Promise<WorkoutHistoryPage>;
  listExerciseHistory(
    userId: string,
    exerciseId: string | undefined,
    exerciseName: string,
    pageSize: number,
  ): Promise<readonly WorkoutSetRecord[]>;
  updateHistory(userId: string, update: WorkoutHistoryUpdate): Promise<void>;
  deleteHistory(userId: string, documentIds: readonly string[]): Promise<void>;
}
