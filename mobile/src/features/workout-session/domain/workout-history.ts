import { isCivilDate } from '../../../shared/validation/civil-date';

import type { WorkoutSetRecord } from './workout-set-record';
import { WorkoutSessionValidationError } from './workout-session-rules';

export interface WorkoutHistorySession {
  readonly id: string;
  readonly performedOn: string;
  readonly workoutName: string;
  readonly records: readonly WorkoutSetRecord[];
}

export interface WorkoutHistorySetEdit {
  readonly id: string;
  readonly exerciseName: string;
  readonly setNumber: number;
  readonly loadKg: string;
  readonly repetitions: string;
  readonly rpe: string;
  readonly note: string;
}

export interface WorkoutHistoryEditDraft {
  readonly sessionId: string;
  readonly performedOn: string;
  readonly workoutName: string;
  readonly sets: readonly WorkoutHistorySetEdit[];
}

export interface WorkoutHistorySetUpdate {
  readonly id: string;
  readonly loadKg: number;
  readonly repetitions: number;
  readonly rpe: number;
  readonly note: string;
}

export interface WorkoutHistoryUpdate {
  readonly sessionId: string;
  readonly performedOn: string;
  readonly workoutName: string;
  readonly sets: readonly WorkoutHistorySetUpdate[];
}

function logicalSessionId(record: WorkoutSetRecord): string {
  return record.sessionId ?? `legacy:${record.performedOn}:${record.workoutName}`;
}

export function groupWorkoutHistory(
  records: readonly WorkoutSetRecord[],
): WorkoutHistorySession[] {
  const grouped = new Map<string, WorkoutSetRecord[]>();
  for (const record of records) {
    const id = logicalSessionId(record);
    grouped.set(id, [...(grouped.get(id) ?? []), record]);
  }

  return [...grouped.entries()]
    .map(([id, sessionRecords]) => {
      const first = sessionRecords[0];
      if (!first) throw new Error('Workout history session cannot be empty');
      return {
        id,
        performedOn: first.performedOn,
        workoutName: first.workoutName,
        records: [...sessionRecords].sort((left, right) => {
          const byExercise = left.exerciseName.localeCompare(right.exerciseName);
          return byExercise || left.setNumber - right.setNumber;
        }),
      };
    })
    .sort((left, right) => {
      const byDate = right.performedOn.localeCompare(left.performedOn);
      return byDate || right.id.localeCompare(left.id);
    });
}

export function createWorkoutHistoryEditDraft(
  session: WorkoutHistorySession,
): WorkoutHistoryEditDraft {
  return {
    sessionId: session.id,
    performedOn: session.performedOn,
    workoutName: session.workoutName,
    sets: session.records.map((record) => ({
      id: record.id,
      exerciseName: record.exerciseName,
      setNumber: record.setNumber,
      loadKg: String(record.loadKg),
      repetitions: String(record.repetitions),
      rpe: String(record.rpe),
      note: record.note,
    })),
  };
}

function parseNumber(
  value: string,
  options: {
    readonly min: number;
    readonly max: number;
    readonly integer?: boolean;
    readonly code: 'load' | 'repetitions' | 'rpe';
    readonly exerciseName: string;
    readonly setNumber: number;
  },
): number {
  const parsed = Number(value.trim().replace(',', '.'));
  if (
    value.trim() === '' ||
    !Number.isFinite(parsed) ||
    parsed < options.min ||
    parsed > options.max ||
    (options.integer && !Number.isInteger(parsed))
  ) {
    throw new WorkoutSessionValidationError(
      options.code,
      options.exerciseName,
      options.setNumber,
    );
  }
  return parsed;
}

export function prepareWorkoutHistoryUpdate(
  draft: WorkoutHistoryEditDraft,
): WorkoutHistoryUpdate {
  if (!isCivilDate(draft.performedOn)) {
    throw new WorkoutSessionValidationError('date');
  }
  const workoutName = draft.workoutName.trim();
  if (!workoutName || workoutName.length > 80) {
    throw new WorkoutSessionValidationError('division');
  }
  if (!draft.sets.length) throw new WorkoutSessionValidationError('empty-session');

  return {
    sessionId: draft.sessionId,
    performedOn: draft.performedOn,
    workoutName,
    sets: draft.sets.map((set) => {
      const note = set.note.trim();
      if (note.length > 500) {
        throw new WorkoutSessionValidationError('note', set.exerciseName, set.setNumber);
      }
      return {
        id: set.id,
        loadKg: parseNumber(set.loadKg, {
          min: 0,
          max: 2000,
          code: 'load',
          exerciseName: set.exerciseName,
          setNumber: set.setNumber,
        }),
        repetitions: parseNumber(set.repetitions, {
          min: 1,
          max: 1000,
          integer: true,
          code: 'repetitions',
          exerciseName: set.exerciseName,
          setNumber: set.setNumber,
        }),
        rpe: parseNumber(set.rpe, {
          min: 1,
          max: 10,
          integer: true,
          code: 'rpe',
          exerciseName: set.exerciseName,
          setNumber: set.setNumber,
        }),
        note,
      };
    }),
  };
}
