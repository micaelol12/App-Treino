import {
  createInitialWorkoutTimer,
  formatWorkoutTimer,
  getWorkoutTimerElapsedMs,
} from './workout-timer';

describe('workout timer', () => {
  it.each([
    [0, '00:00.000'],
    [59_999, '00:59.999'],
    [60_000, '01:00.000'],
    [3_661_000, '01:01:01.000'],
  ])('formats %i milliseconds as %s', (elapsedMs, expected) => {
    expect(formatWorkoutTimer(elapsedMs)).toBe(expected);
  });

  it('derives running time from timestamps and tolerates clock rollback', () => {
    const timer = {
      ...createInitialWorkoutTimer('rest'),
      status: 'running' as const,
      startedAtMs: 10_000,
      accumulatedMs: 2_000,
    };

    expect(getWorkoutTimerElapsedMs(timer, 15_000)).toBe(7_000);
    expect(getWorkoutTimerElapsedMs(timer, 9_000)).toBe(2_000);
  });
});
