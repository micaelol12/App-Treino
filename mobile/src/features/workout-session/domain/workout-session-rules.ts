import type { WorkoutPlanExercise } from '../../workout-plans/domain/workout-plan-exercise';

import type {
  CompletedWorkoutSession,
  WorkoutSessionDraft,
  WorkoutSetDraft,
} from './workout-session-draft';

export type WorkoutSessionValidationCode =
  | 'date'
  | 'division'
  | 'empty-plan'
  | 'load'
  | 'repetitions'
  | 'rpe'
  | 'note'
  | 'empty-session';

export class WorkoutSessionValidationError extends Error {
  constructor(
    readonly code: WorkoutSessionValidationCode,
    readonly exerciseName?: string,
    readonly setNumber?: number,
  ) {
    super(code);
    this.name = 'WorkoutSessionValidationError';
  }
}

type CreateWorkoutSessionDraftInput = {
  readonly sessionId: string;
  readonly userId: string;
  readonly performedOn: string;
  readonly division: string;
  readonly exercises: readonly WorkoutPlanExercise[];
};

function isCivilDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function createDefaultSet(setNumber: number): WorkoutSetDraft {
  return { setNumber, loadKg: '0', repetitions: '0', rpe: '8', note: '' };
}

export function createWorkoutSessionDraft({
  division,
  exercises,
  performedOn,
  sessionId,
  userId,
}: CreateWorkoutSessionDraftInput): WorkoutSessionDraft {
  const normalizedDivision = division.trim();
  const selectedExercises = exercises.filter(
    (exercise) => exercise.division === normalizedDivision,
  );

  if (!sessionId.trim() || !userId.trim()) {
    throw new WorkoutSessionValidationError('empty-plan');
  }
  if (!isCivilDate(performedOn)) {
    throw new WorkoutSessionValidationError('date');
  }
  if (!normalizedDivision) {
    throw new WorkoutSessionValidationError('division');
  }
  if (!selectedExercises.length) {
    throw new WorkoutSessionValidationError('empty-plan');
  }

  return {
    sessionId,
    userId,
    performedOn,
    division: normalizedDivision,
    exercises: selectedExercises.map((exercise) => ({
      planExerciseId: exercise.id,
      name: exercise.name,
      sets: Array.from({ length: exercise.defaultSets }, (_, index) =>
        createDefaultSet(index + 1),
      ),
    })),
  };
}

function parseNumber(
  value: string,
  options: {
    readonly integer?: boolean;
    readonly min: number;
    readonly max: number;
    readonly code: WorkoutSessionValidationCode;
    readonly exerciseName: string;
    readonly setNumber: number;
  },
): number {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);
  const validInteger = !options.integer || Number.isInteger(parsed);

  if (
    normalized === '' ||
    !Number.isFinite(parsed) ||
    !validInteger ||
    parsed < options.min ||
    parsed > options.max
  ) {
    throw new WorkoutSessionValidationError(
      options.code,
      options.exerciseName,
      options.setNumber,
    );
  }

  return parsed;
}

export function prepareWorkoutSessionCompletion(
  draft: WorkoutSessionDraft,
): CompletedWorkoutSession {
  if (!isCivilDate(draft.performedOn)) {
    throw new WorkoutSessionValidationError('date');
  }
  if (!draft.division.trim()) {
    throw new WorkoutSessionValidationError('division');
  }

  const sets = draft.exercises.flatMap((exercise) =>
    exercise.sets.flatMap((set) => {
      const loadKg = parseNumber(set.loadKg, {
        min: 0,
        max: 2000,
        code: 'load',
        exerciseName: exercise.name,
        setNumber: set.setNumber,
      });
      const repetitions = parseNumber(set.repetitions, {
        integer: true,
        min: 0,
        max: 1000,
        code: 'repetitions',
        exerciseName: exercise.name,
        setNumber: set.setNumber,
      });
      const rpe = parseNumber(set.rpe, {
        integer: true,
        min: 1,
        max: 10,
        code: 'rpe',
        exerciseName: exercise.name,
        setNumber: set.setNumber,
      });
      const note = set.note.trim();
      if (note.length > 500) {
        throw new WorkoutSessionValidationError('note', exercise.name, set.setNumber);
      }

      return repetitions === 0
        ? []
        : [
            {
              planExerciseId: exercise.planExerciseId,
              exerciseName: exercise.name,
              setNumber: set.setNumber,
              loadKg,
              repetitions,
              rpe,
              note,
            },
          ];
    }),
  );

  if (!sets.length) {
    throw new WorkoutSessionValidationError('empty-session');
  }

  return {
    sessionId: draft.sessionId,
    performedOn: draft.performedOn,
    division: draft.division,
    sets,
  };
}
