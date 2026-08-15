import type { WorkoutSessionDraft } from '../domain/workout-session-draft';

import { CompleteWorkoutSession } from './complete-workout-session';
import type { WorkoutSessionRepository } from './workout-session-repository';

const draft: WorkoutSessionDraft = {
  sessionId: 'session-1',
  userId: 'user-1',
  performedOn: '2026-08-15',
  division: 'Push',
  exercises: [
    {
      planExerciseId: 'bench',
      name: 'Supino',
      sets: [
        { setNumber: 1, loadKg: '60', repetitions: '10', rpe: '8', note: '' },
        { setNumber: 2, loadKg: '60', repetitions: '0', rpe: '8', note: '' },
      ],
    },
  ],
};

describe('CompleteWorkoutSession', () => {
  it('prepares and persists only executed sets', async () => {
    const complete = jest.fn().mockResolvedValue(undefined);
    const repository: WorkoutSessionRepository = { complete };

    await expect(
      new CompleteWorkoutSession(repository).execute('user-1', draft),
    ).resolves.toBe(1);
    expect(complete).toHaveBeenCalledWith('user-1', {
      sessionId: 'session-1',
      performedOn: '2026-08-15',
      division: 'Push',
      sets: [
        {
          planExerciseId: 'bench',
          exerciseName: 'Supino',
          setNumber: 1,
          loadKg: 60,
          repetitions: 10,
          rpe: 8,
          note: '',
        },
      ],
    });
  });

  it('does not persist a draft owned by another user', async () => {
    const complete = jest.fn();
    const useCase = new CompleteWorkoutSession({ complete });

    await expect(useCase.execute('user-2', draft)).rejects.toThrow(
      'Workout draft does not belong to the authenticated user',
    );
    expect(complete).not.toHaveBeenCalled();
  });
});
