import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import type { WorkoutSessionDraft } from '../domain/workout-session-draft';

import { useActiveWorkoutStore } from './active-workout.store';
import { createInitialWorkoutTimer } from './workout-timer';

const draft: WorkoutSessionDraft = {
  sessionId: 'session-1',
  userId: 'user-1',
  performedOn: '2026-08-15',
  division: 'Push',
  exercises: [
    {
      planExerciseId: 'bench',
      name: 'Supino',
      sets: [{ setNumber: 1, loadKg: '0', repetitions: '0', rpe: '8', note: '' }],
    },
    {
      planExerciseId: 'fly',
      name: 'Crucifixo',
      sets: [{ setNumber: 1, loadKg: '0', repetitions: '0', rpe: '8', note: '' }],
    },
  ],
};

describe('active workout store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useActiveWorkoutStore.setState({
      draft: null,
      currentExerciseIndex: 0,
      timer: createInitialWorkoutTimer(),
      hasHydrated: true,
    });
  });

  it('keeps edits while navigating and persists the draft', async () => {
    const actions = useActiveWorkoutStore.getState();
    actions.start(draft);
    useActiveWorkoutStore.getState().updateSet(0, 0, {
      loadKg: '62,5',
      repetitions: '10',
    });
    useActiveWorkoutStore.getState().nextExercise();
    useActiveWorkoutStore.getState().nextExercise();

    expect(useActiveWorkoutStore.getState().currentExerciseIndex).toBe(1);
    useActiveWorkoutStore.getState().previousExercise();
    expect(useActiveWorkoutStore.getState().draft?.exercises[0]?.sets[0]).toEqual(
      expect.objectContaining({ loadKg: '62,5', repetitions: '10' }),
    );

    await waitFor(async () => {
      const serialized = await AsyncStorage.getItem('app-treino-active-workout');
      expect(serialized).toContain('62,5');
      expect(serialized).toContain('session-1');
    });
  });

  it('restores a persisted draft after rehydration', async () => {
    useActiveWorkoutStore.setState({ draft: null, currentExerciseIndex: 0 });
    await AsyncStorage.setItem(
      'app-treino-active-workout',
      JSON.stringify({ state: { draft, currentExerciseIndex: 1 }, version: 1 }),
    );

    await useActiveWorkoutStore.persist.rehydrate();

    expect(useActiveWorkoutStore.getState()).toEqual(
      expect.objectContaining({
        draft,
        currentExerciseIndex: 1,
        timer: createInitialWorkoutTimer(),
        hasHydrated: true,
      }),
    );
  });

  it('persists timer actions without interval writes and derives elapsed time', () => {
    useActiveWorkoutStore.getState().start(draft);
    useActiveWorkoutStore.getState().selectTimerMode('rest');
    useActiveWorkoutStore.getState().startTimer(1_000);
    useActiveWorkoutStore.getState().pauseTimer(6_500);

    expect(useActiveWorkoutStore.getState().timer).toEqual({
      mode: 'rest',
      status: 'paused',
      startedAtMs: null,
      accumulatedMs: 5_500,
    });

    useActiveWorkoutStore.getState().startTimer(10_000);
    expect(useActiveWorkoutStore.getState().timer).toEqual(
      expect.objectContaining({ status: 'running', startedAtMs: 10_000 }),
    );
  });

  it('clears the draft and clamps navigation without a session', () => {
    useActiveWorkoutStore.getState().previousExercise();
    useActiveWorkoutStore.getState().nextExercise();
    expect(useActiveWorkoutStore.getState().currentExerciseIndex).toBe(0);

    useActiveWorkoutStore.getState().start(draft);
    useActiveWorkoutStore.getState().clear();
    expect(useActiveWorkoutStore.getState()).toEqual(
      expect.objectContaining({
        draft: null,
        currentExerciseIndex: 0,
        timer: createInitialWorkoutTimer(),
      }),
    );
  });
});
