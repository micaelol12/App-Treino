export interface WorkoutSetDraft {
  readonly setNumber: number;
  readonly loadKg: string;
  readonly repetitions: string;
  readonly rpe: string;
  readonly note: string;
}

export interface WorkoutExerciseDraft {
  readonly planExerciseId: string;
  readonly name: string;
  readonly sets: readonly WorkoutSetDraft[];
}

export interface WorkoutSessionDraft {
  readonly sessionId: string;
  readonly userId: string;
  readonly performedOn: string;
  readonly division: string;
  readonly exercises: readonly WorkoutExerciseDraft[];
}

export interface ExecutedWorkoutSet {
  readonly planExerciseId: string;
  readonly exerciseName: string;
  readonly setNumber: number;
  readonly loadKg: number;
  readonly repetitions: number;
  readonly rpe: number;
  readonly note: string;
}

export interface CompletedWorkoutSession {
  readonly sessionId: string;
  readonly performedOn: string;
  readonly division: string;
  readonly sets: readonly ExecutedWorkoutSet[];
}
