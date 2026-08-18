import type { WorkoutSetRecord } from '@/features/workout-session/domain/workout-set-record';

export interface ProgressPageCursor {
  readonly id: string;
  readonly performedOn: string;
}

export interface ProgressPage {
  readonly records: WorkoutSetRecord[];
  readonly nextCursor: ProgressPageCursor | null;
}

export interface ProgressRepository {
  listExercisePage(
    userId: string,
    exerciseId: string | undefined,
    exerciseName: string,
    pageSize: number,
    cursor?: ProgressPageCursor,
  ): Promise<ProgressPage>;
}
