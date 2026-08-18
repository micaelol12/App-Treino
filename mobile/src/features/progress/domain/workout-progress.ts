import type { WorkoutSetRecord } from '@/features/workout-session/domain/workout-set-record';

export interface WorkoutProgressPoint {
  readonly id: string;
  readonly performedOn: string;
  readonly maxLoadKg: number;
  readonly estimatedOneRepMaxKg: number;
  readonly volumeKg: number;
  readonly setCount: number;
}

export function calculateEstimatedOneRepMax(loadKg: number, repetitions: number): number {
  return loadKg * (1 + repetitions / 30);
}

function logicalSessionId(record: WorkoutSetRecord): string {
  return record.sessionId ?? `legacy:${record.performedOn}:${record.workoutName}`;
}

export function calculateWorkoutProgress(
  records: readonly WorkoutSetRecord[],
): WorkoutProgressPoint[] {
  const sessions = new Map<string, WorkoutProgressPoint>();

  for (const record of records) {
    const id = logicalSessionId(record);
    const estimatedOneRepMaxKg = calculateEstimatedOneRepMax(
      record.loadKg,
      record.repetitions,
    );
    const current = sessions.get(id);
    sessions.set(id, {
      id,
      performedOn: record.performedOn,
      maxLoadKg: Math.max(current?.maxLoadKg ?? 0, record.loadKg),
      estimatedOneRepMaxKg: Math.max(
        current?.estimatedOneRepMaxKg ?? 0,
        estimatedOneRepMaxKg,
      ),
      volumeKg: (current?.volumeKg ?? 0) + record.loadKg * record.repetitions,
      setCount: (current?.setCount ?? 0) + 1,
    });
  }

  return [...sessions.values()].sort((left, right) => {
    const byDate = left.performedOn.localeCompare(right.performedOn);
    return byDate || left.id.localeCompare(right.id);
  });
}
