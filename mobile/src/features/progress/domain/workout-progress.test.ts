import type { WorkoutSetRecord } from '@/features/workout-session/domain/workout-set-record';

import {
  calculateEstimatedOneRepMax,
  calculateWorkoutProgress,
} from './workout-progress';

const record = (
  id: string,
  performedOn: string,
  loadKg: number,
  repetitions: number,
  sessionId?: string,
): WorkoutSetRecord => ({
  id,
  performedOn,
  workoutName: 'Push',
  exerciseName: 'Supino Reto',
  setNumber: Number(id.at(-1)) || 1,
  loadKg,
  repetitions,
  rpe: 8,
  note: '',
  sourceSchemaVersion: sessionId ? 1 : 0,
  ...(sessionId ? { sessionId } : {}),
});

describe('workout progress', () => {
  it('uses the preserved Epley formula', () => {
    expect(calculateEstimatedOneRepMax(60, 10)).toBe(80);
    expect(calculateEstimatedOneRepMax(62.5, 10)).toBeCloseTo(83.33, 2);
  });

  it('aggregates maximum load, maximum 1RM and volume by logical session', () => {
    const points = calculateWorkoutProgress([
      record('set-1', '2026-07-01', 60, 10, 'session-1'),
      record('set-2', '2026-07-01', 60, 8, 'session-1'),
      record('set-3', '2026-07-08', 62.5, 10, 'session-2'),
      record('set-4', '2026-07-08', 62.5, 9, 'session-2'),
    ]);

    expect(points).toEqual([
      expect.objectContaining({
        performedOn: '2026-07-01',
        maxLoadKg: 60,
        estimatedOneRepMaxKg: 80,
        volumeKg: 1080,
      }),
      expect.objectContaining({
        performedOn: '2026-07-08',
        maxLoadKg: 62.5,
        estimatedOneRepMaxKg: 83.33333333333333,
        volumeKg: 1187.5,
      }),
    ]);
  });

  it('groups legacy sets by date and workout name', () => {
    expect(
      calculateWorkoutProgress([
        record('legacy-1', '2026-07-01', 60, 10),
        record('legacy-2', '2026-07-01', 60, 8),
      ]),
    ).toHaveLength(1);
  });
});
