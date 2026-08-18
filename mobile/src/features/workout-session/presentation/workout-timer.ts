export type WorkoutTimerMode = 'set' | 'rest';
export type WorkoutTimerStatus = 'idle' | 'running' | 'paused';

export interface WorkoutTimerState {
  readonly mode: WorkoutTimerMode;
  readonly status: WorkoutTimerStatus;
  readonly startedAtMs: number | null;
  readonly accumulatedMs: number;
}

export function createInitialWorkoutTimer(
  mode: WorkoutTimerMode = 'set',
): WorkoutTimerState {
  return {
    mode,
    status: 'idle',
    startedAtMs: null,
    accumulatedMs: 0,
  };
}

export function getWorkoutTimerElapsedMs(
  timer: WorkoutTimerState,
  nowMs: number,
): number {
  if (timer.status !== 'running' || timer.startedAtMs === null) {
    return timer.accumulatedMs;
  }

  return timer.accumulatedMs + Math.max(0, nowMs - timer.startedAtMs);
}

export function formatWorkoutTimer(elapsedMs: number): string {
  const normalizedMs = Math.floor(Math.max(0, elapsedMs));
  const milliseconds = normalizedMs % 1000;
  const totalSeconds = Math.floor(normalizedMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const parts = [minutes, seconds].map((part) => String(part).padStart(2, '0'));

  const time =
    hours > 0 ? `${String(hours).padStart(2, '0')}:${parts.join(':')}` : parts.join(':');
  return `${time}.${String(milliseconds).padStart(3, '0')}`;
}
