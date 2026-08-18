import type { WorkoutPlanExercise } from '../../workout-plans/domain/workout-plan-exercise';

import type { WorkoutSessionDraft } from './workout-session-draft';
import {
  createWorkoutSessionDraft,
  prepareWorkoutSessionCompletion,
  WorkoutSessionValidationError,
} from './workout-session-rules';

const plan: WorkoutPlanExercise[] = [
  {
    id: 'bench',
    documentId: 'exercise-document',
    divisionId: 'push',
    division: 'Push',
    divisionOrder: 1,
    exerciseId: 'bench-catalog',
    exerciseDocumentId: 'exercise-document',
    name: 'Supino',
    defaultSets: 2,
    order: 1,
    sourceSchemaVersion: 2,
  },
  {
    id: 'row',
    documentId: 'row-document',
    divisionId: 'pull',
    division: 'Pull',
    divisionOrder: 2,
    exerciseId: 'row-catalog',
    exerciseDocumentId: 'row-document',
    name: 'Remada',
    defaultSets: 3,
    order: 1,
    sourceSchemaVersion: 2,
  },
];

function createDraft(): WorkoutSessionDraft {
  return createWorkoutSessionDraft({
    sessionId: 'session-1',
    userId: 'user-1',
    performedOn: '2026-08-15',
    divisionId: 'push',
    exercises: plan,
  });
}

describe('workout session rules', () => {
  it('creates default sets only for the selected division', () => {
    expect(createDraft()).toEqual({
      sessionId: 'session-1',
      userId: 'user-1',
      performedOn: '2026-08-15',
      divisionId: 'push',
      division: 'Push',
      exercises: [
        {
          planExerciseId: 'bench',
          exerciseId: 'bench-catalog',
          exerciseDocumentId: 'exercise-document',
          name: 'Supino',
          sets: [
            { setNumber: 1, loadKg: '0', repetitions: '0', rpe: '8', note: '' },
            { setNumber: 2, loadKg: '0', repetitions: '0', rpe: '8', note: '' },
          ],
        },
      ],
    });
  });

  it.each([
    [{ performedOn: '2026-02-30' }, 'date'],
    [{ divisionId: ' ' }, 'division'],
    [{ divisionId: 'legs' }, 'empty-plan'],
    [{ sessionId: '' }, 'empty-plan'],
    [{ userId: '' }, 'empty-plan'],
  ] as const)('rejects invalid session creation input', (override, code) => {
    expect(() =>
      createWorkoutSessionDraft({
        sessionId: 'session-1',
        userId: 'user-1',
        performedOn: '2026-08-15',
        divisionId: 'push',
        exercises: plan,
        ...override,
      }),
    ).toThrow(expect.objectContaining({ code }));
  });

  it('normalizes decimal comma and ignores sets with zero repetitions', () => {
    const draft = createDraft();
    const result = prepareWorkoutSessionCompletion({
      ...draft,
      exercises: [
        {
          ...draft.exercises[0]!,
          sets: [
            { setNumber: 1, loadKg: '62,5', repetitions: '10', rpe: '9', note: ' Boa ' },
            { setNumber: 2, loadKg: '0', repetitions: '0', rpe: '8', note: '' },
          ],
        },
      ],
    });

    expect(result).toEqual({
      sessionId: 'session-1',
      performedOn: '2026-08-15',
      divisionId: 'push',
      division: 'Push',
      sets: [
        {
          planExerciseId: 'bench',
          exerciseId: 'bench-catalog',
          exerciseDocumentId: 'exercise-document',
          exerciseName: 'Supino',
          setNumber: 1,
          loadKg: 62.5,
          repetitions: 10,
          rpe: 9,
          note: 'Boa',
        },
      ],
    });
  });

  it.each([
    ['loadKg', '', 'load'],
    ['loadKg', '-1', 'load'],
    ['loadKg', '2001', 'load'],
    ['repetitions', '1.5', 'repetitions'],
    ['repetitions', '-1', 'repetitions'],
    ['repetitions', '1001', 'repetitions'],
    ['rpe', '0', 'rpe'],
    ['rpe', '8.5', 'rpe'],
    ['rpe', '11', 'rpe'],
  ] as const)('rejects invalid %s values', (field, value, code) => {
    const draft = createDraft();
    const firstExercise = draft.exercises[0]!;
    const firstSet = firstExercise.sets[0]!;

    expect(() =>
      prepareWorkoutSessionCompletion({
        ...draft,
        exercises: [
          {
            ...firstExercise,
            sets: [{ ...firstSet, repetitions: '1', [field]: value }],
          },
        ],
      }),
    ).toThrow(
      expect.objectContaining({
        code,
        exerciseName: 'Supino',
        setNumber: 1,
      }),
    );
  });

  it('rejects a long note', () => {
    const draft = createDraft();
    const exercise = draft.exercises[0]!;
    expect(() =>
      prepareWorkoutSessionCompletion({
        ...draft,
        exercises: [
          {
            ...exercise,
            sets: [{ ...exercise.sets[0]!, repetitions: '1', note: 'a'.repeat(501) }],
          },
        ],
      }),
    ).toThrow(expect.objectContaining({ code: 'note' }));
  });

  it('rejects completion without an executed set', () => {
    expect(() => prepareWorkoutSessionCompletion(createDraft())).toThrow(
      new WorkoutSessionValidationError('empty-session'),
    );
  });

  it.each([
    [{ performedOn: 'invalid' }, 'date'],
    [{ division: ' ' }, 'division'],
  ] as const)('revalidates session metadata at completion', (override, code) => {
    expect(() =>
      prepareWorkoutSessionCompletion({ ...createDraft(), ...override }),
    ).toThrow(expect.objectContaining({ code }));
  });
});
