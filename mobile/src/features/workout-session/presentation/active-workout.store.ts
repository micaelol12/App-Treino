import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  WorkoutSessionDraft,
  WorkoutSetDraft,
} from '../domain/workout-session-draft';

type WorkoutSetPatch = Partial<
  Pick<WorkoutSetDraft, 'loadKg' | 'repetitions' | 'rpe' | 'note'>
>;

type ActiveWorkoutState = {
  readonly draft: WorkoutSessionDraft | null;
  readonly currentExerciseIndex: number;
  readonly hasHydrated: boolean;
  start(draft: WorkoutSessionDraft): void;
  updateSet(exerciseIndex: number, setIndex: number, patch: WorkoutSetPatch): void;
  previousExercise(): void;
  nextExercise(): void;
  clear(): void;
  setHasHydrated(hasHydrated: boolean): void;
};

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set) => ({
      draft: null,
      currentExerciseIndex: 0,
      hasHydrated: false,
      start: (draft) => set({ draft, currentExerciseIndex: 0 }),
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
      clear: () => set({ draft: null, currentExerciseIndex: 0 }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'app-treino-active-workout',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ currentExerciseIndex, draft }) => ({
        currentExerciseIndex,
        draft,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
