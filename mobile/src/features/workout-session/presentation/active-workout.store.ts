import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  WorkoutSessionDraft,
  WorkoutSetDraft,
} from '../domain/workout-session-draft';

import {
  createInitialWorkoutTimer,
  getWorkoutTimerElapsedMs,
  type WorkoutTimerMode,
  type WorkoutTimerState,
} from './workout-timer';

type WorkoutSetPatch = Partial<
  Pick<WorkoutSetDraft, 'loadKg' | 'repetitions' | 'rpe' | 'note'>
>;

type ActiveWorkoutState = {
  readonly draft: WorkoutSessionDraft | null;
  readonly currentExerciseIndex: number;
  readonly timer: WorkoutTimerState;
  readonly hasHydrated: boolean;
  start(draft: WorkoutSessionDraft): void;
  updateSet(exerciseIndex: number, setIndex: number, patch: WorkoutSetPatch): void;
  previousExercise(): void;
  nextExercise(): void;
  selectTimerMode(mode: WorkoutTimerMode): void;
  startTimer(nowMs?: number): void;
  pauseTimer(nowMs?: number): void;
  resetTimer(): void;
  clear(): void;
  setHasHydrated(hasHydrated: boolean): void;
};

type PersistedActiveWorkoutState = Pick<
  ActiveWorkoutState,
  'draft' | 'currentExerciseIndex' | 'timer'
>;

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set) => ({
      draft: null,
      currentExerciseIndex: 0,
      timer: createInitialWorkoutTimer(),
      hasHydrated: false,
      start: (draft) =>
        set({ draft, currentExerciseIndex: 0, timer: createInitialWorkoutTimer() }),
      updateSet: (exerciseIndex, setIndex, patch) =>
        set((state) => {
          if (!state.draft) return state;

          return {
            draft: {
              ...state.draft,
              exercises: state.draft.exercises.map((exercise, exercisePosition) =>
                exercisePosition !== exerciseIndex
                  ? exercise
                  : {
                      ...exercise,
                      sets: exercise.sets.map((workoutSet, setPosition) =>
                        setPosition === setIndex
                          ? { ...workoutSet, ...patch }
                          : workoutSet,
                      ),
                    },
              ),
            },
          };
        }),
      previousExercise: () =>
        set((state) => ({
          currentExerciseIndex: Math.max(0, state.currentExerciseIndex - 1),
        })),
      nextExercise: () =>
        set((state) => ({
          currentExerciseIndex: Math.min(
            Math.max(0, (state.draft?.exercises.length ?? 1) - 1),
            state.currentExerciseIndex + 1,
          ),
        })),
      selectTimerMode: (mode) =>
        set((state) =>
          state.timer.mode === mode ? state : { timer: createInitialWorkoutTimer(mode) },
        ),
      startTimer: (nowMs = Date.now()) =>
        set((state) =>
          state.timer.status === 'running'
            ? state
            : {
                timer: {
                  ...state.timer,
                  status: 'running',
                  startedAtMs: nowMs,
                },
              },
        ),
      pauseTimer: (nowMs = Date.now()) =>
        set((state) =>
          state.timer.status !== 'running'
            ? state
            : {
                timer: {
                  ...state.timer,
                  status: 'paused',
                  startedAtMs: null,
                  accumulatedMs: getWorkoutTimerElapsedMs(state.timer, nowMs),
                },
              },
        ),
      resetTimer: () =>
        set((state) => ({ timer: createInitialWorkoutTimer(state.timer.mode) })),
      clear: () =>
        set({
          draft: null,
          currentExerciseIndex: 0,
          timer: createInitialWorkoutTimer(),
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'app-treino-active-workout',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ currentExerciseIndex, draft, timer }) => ({
        currentExerciseIndex,
        draft,
        timer,
      }),
      migrate: (persistedState, version): PersistedActiveWorkoutState => {
        const state = persistedState as Partial<PersistedActiveWorkoutState>;
        return {
          draft: state.draft ?? null,
          currentExerciseIndex: state.currentExerciseIndex ?? 0,
          timer:
            version < 2
              ? createInitialWorkoutTimer()
              : (state.timer ?? createInitialWorkoutTimer()),
        };
      },
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
