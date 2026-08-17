import type { WorkoutSetRecord } from './workout-set-record';
import {
  createWorkoutHistoryEditDraft,
  groupWorkoutHistory,
  prepareWorkoutHistoryUpdate,
} from './workout-history';
import { WorkoutSessionValidationError } from './workout-session-rules';

function record(
  id: string,
  performedOn: string,
  exerciseName: string,
  setNumber: number,
  sessionId?: string,
): WorkoutSetRecord {
  return {
    id,
    performedOn,
    workoutName: 'Push',
    exerciseName,
    setNumber,
    loadKg: 60,
    repetitions: 10,
    rpe: 8,
    note: '',
    sourceSchemaVersion: sessionId ? 1 : 0,
    ...(sessionId ? { sessionId } : {}),
  };
}

describe('workout history', () => {
  it('groups modern and legacy sets into newest-first sessions', () => {
    const sessions = groupWorkoutHistory([
      record('b', '2026-08-15', 'Crucifixo', 1, 'session-modern'),
      record('a', '2026-08-15', 'Supino', 2, 'session-modern'),
      record('c', '2026-08-14', 'Supino', 1),
      record('d', '2026-08-14', 'Supino', 2),
    ]);

    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toMatchObject({
      id: 'session-modern',
      performedOn: '2026-08-15',
    });
    expect(sessions[0]?.records.map(({ id }) => id)).toEqual(['b', 'a']);
    expect(sessions[1]).toMatchObject({ id: 'legacy:2026-08-14:Push' });
  });

  it('creates an editable draft and prepares normalized numeric updates', () => {
    const session = groupWorkoutHistory([
      record('a', '2026-08-15', 'Supino', 1, 'session-1'),
    ])[0];
    expect(session).toBeDefined();
    const draft = createWorkoutHistoryEditDraft(session!);

    expect(
      prepareWorkoutHistoryUpdate({
        ...draft,
        workoutName: ' Push ',
        sets: [{ ...draft.sets[0]!, loadKg: '62,5', repetitions: '8', note: ' boa ' }],
      }),
    ).toEqual({
      sessionId: 'session-1',
      performedOn: '2026-08-15',
      workoutName: 'Push',
      sets: [{ id: 'a', loadKg: 62.5, repetitions: 8, rpe: 8, note: 'boa' }],
    });
  });

  it.each([
    [{ performedOn: '2026-02-30' }, 'date'],
    [{ workoutName: '' }, 'division'],
    [{ sets: [] }, 'empty-session'],
  ])('rejects an invalid session draft', (patch, code) => {
    const session = groupWorkoutHistory([
      record('a', '2026-08-15', 'Supino', 1, 'session-1'),
    ])[0]!;
    const draft = { ...createWorkoutHistoryEditDraft(session), ...patch };
    expect(() => prepareWorkoutHistoryUpdate(draft)).toThrow(
      expect.objectContaining({ code }) as WorkoutSessionValidationError,
    );
  });

  it.each([
    ['loadKg', '-1', 'load'],
    ['repetitions', '1.5', 'repetitions'],
    ['rpe', '11', 'rpe'],
    ['note', 'x'.repeat(501), 'note'],
  ] as const)('rejects invalid %s values', (field, value, code) => {
    const session = groupWorkoutHistory([
      record('a', '2026-08-15', 'Supino', 1, 'session-1'),
    ])[0]!;
    const draft = createWorkoutHistoryEditDraft(session);
    expect(() =>
      prepareWorkoutHistoryUpdate({
        ...draft,
        sets: [{ ...draft.sets[0]!, [field]: value }],
      }),
    ).toThrow(expect.objectContaining({ code }) as WorkoutSessionValidationError);
  });
});
