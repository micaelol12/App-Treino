import type { WorkoutPlanExercise } from './workout-plan-exercise';
import {
  hasDuplicateExercise,
  hasDuplicateOrder,
  moveWorkoutExercise,
  sortWorkoutExercises,
  validateWorkoutExerciseDraft,
  WorkoutPlanRuleError,
} from './workout-plan-rules';

const exercise = (
  id: string,
  division: string,
  name: string,
  order: number,
): WorkoutPlanExercise => ({
  id,
  division,
  name,
  defaultSets: 3,
  order,
  sourceSchemaVersion: 0,
});

describe('workout plan rules', () => {
  it('normalizes labels and accepts the supported limits', () => {
    expect(
      validateWorkoutExerciseDraft({
        division: '  Push   A ',
        name: '  Supino   Reto ',
        defaultSets: 10,
        order: 999,
      }),
    ).toEqual({
      division: 'Push A',
      name: 'Supino Reto',
      defaultSets: 10,
      order: 999,
    });
  });

  it.each([
    [{ division: '', name: 'Supino', defaultSets: 3, order: 1 }, 'division-required'],
    [
      { division: 'a'.repeat(81), name: 'Supino', defaultSets: 3, order: 1 },
      'division-too-long',
    ],
    [{ division: 'Push', name: '', defaultSets: 3, order: 1 }, 'name-required'],
    [
      { division: 'Push', name: 'a'.repeat(121), defaultSets: 3, order: 1 },
      'name-too-long',
    ],
    [
      { division: 'Push', name: 'Supino', defaultSets: 0, order: 1 },
      'invalid-default-sets',
    ],
    [{ division: 'Push', name: 'Supino', defaultSets: 3, order: 1.5 }, 'invalid-order'],
  ])('rejects invalid drafts', (draft, code) => {
    expect.assertions(2);
    try {
      validateWorkoutExerciseDraft(draft);
    } catch (error) {
      expect(error).toBeInstanceOf(WorkoutPlanRuleError);
      expect((error as WorkoutPlanRuleError).code).toBe(code);
    }
  });

  it('detects a normalized duplicate only inside the same division', () => {
    const exercises = [exercise('1', 'Push', 'Tríceps Corda', 1)];

    expect(
      hasDuplicateExercise(exercises, {
        division: ' push ',
        name: 'triceps   corda',
      }),
    ).toBe(true);
    expect(
      hasDuplicateExercise(exercises, {
        division: 'Pull',
        name: 'Tríceps Corda',
      }),
    ).toBe(false);
    expect(
      hasDuplicateExercise(exercises, { division: 'Push', name: 'Tríceps Corda' }, '1'),
    ).toBe(false);
  });

  it('detects a repeated order only inside the same division', () => {
    const exercises = [exercise('1', 'Push', 'Supino', 1)];

    expect(hasDuplicateOrder(exercises, { division: ' push ', order: 1 })).toBe(true);
    expect(hasDuplicateOrder(exercises, { division: 'Pull', order: 1 })).toBe(false);
    expect(hasDuplicateOrder(exercises, { division: 'Push', order: 1 }, '1')).toBe(false);
  });

  it('sorts by division, order, name and id deterministically', () => {
    const exercises = [
      exercise('4', 'Push', 'Tríceps', 99),
      exercise('3', 'Pull', 'Rosca', 2),
      exercise('2', 'Push', 'Supino', 1),
      exercise('1', 'Push', 'Crucifixo', 1),
    ];

    expect(sortWorkoutExercises(exercises).map(({ id }) => id)).toEqual([
      '3',
      '1',
      '2',
      '4',
    ]);
  });

  it('moves within a division and normalizes legacy or repeated positions', () => {
    const exercises = [
      exercise('1', 'Push', 'Supino', 1),
      exercise('2', 'Push', 'Desenvolvimento', 1),
      exercise('3', 'Push', 'Tríceps', 99),
      exercise('4', 'Pull', 'Rosca', 1),
    ];

    expect(moveWorkoutExercise(exercises, '3', 'up')).toEqual([
      { id: '3', order: 2 },
      { id: '1', order: 3 },
    ]);
    expect(moveWorkoutExercise(exercises, '4', 'up')).toEqual([]);
    expect(moveWorkoutExercise(exercises, 'missing', 'down')).toEqual([]);
  });
});
