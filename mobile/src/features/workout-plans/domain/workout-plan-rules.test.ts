import type { WorkoutPlanExercise } from './workout-plan-exercise';
import {
  hasDuplicateExercise,
  hasDuplicateOrder,
  moveWorkoutExercise,
  sortWorkoutExercises,
  validateWorkoutExerciseDraft,
  WorkoutPlanRuleError,
  type WorkoutExerciseDraft,
} from './workout-plan-rules';

const exercise = (
  id: string,
  divisionId: string,
  name: string,
  order: number,
  divisionOrder = 1,
): WorkoutPlanExercise => ({
  id,
  documentId: id,
  divisionId,
  division: divisionId === 'pull' ? 'Pull' : 'Push',
  divisionOrder,
  exerciseId: id,
  exerciseDocumentId: `doc-${id}`,
  name,
  defaultSets: 3,
  order,
  sourceSchemaVersion: 2,
});

const draft: WorkoutExerciseDraft = {
  divisionId: 'push',
  divisionNameSnapshot: 'Push',
  exerciseId: 'bench',
  exerciseDocumentId: 'doc-bench',
  exerciseNameSnapshot: 'Supino',
  defaultSets: 3,
  order: 1,
};

describe('workout plan rules v2', () => {
  it('trims IDs and snapshots and accepts supported limits', () => {
    expect(
      validateWorkoutExerciseDraft({
        ...draft,
        divisionId: ' push ',
        exerciseId: ' bench ',
        exerciseNameSnapshot: ' Supino ',
        defaultSets: 10,
        order: 999,
      }),
    ).toEqual({
      ...draft,
      exerciseNameSnapshot: 'Supino',
      defaultSets: 10,
      order: 999,
    });
  });

  it.each([
    [{ ...draft, divisionId: '' }, 'division-required'],
    [{ ...draft, exerciseDocumentId: '' }, 'exercise-required'],
    [{ ...draft, defaultSets: 0 }, 'invalid-default-sets'],
    [{ ...draft, order: 1.5 }, 'invalid-order'],
  ] as const)('rejects invalid drafts', (invalid, code) => {
    expect(() => validateWorkoutExerciseDraft(invalid)).toThrow(
      expect.objectContaining<Partial<WorkoutPlanRuleError>>({ code }),
    );
  });

  it('detects duplicate exercise and order by stable IDs inside one division', () => {
    const exercises = [exercise('bench', 'push', 'Supino', 1)];
    expect(
      hasDuplicateExercise(exercises, { divisionId: 'push', exerciseId: 'bench' }),
    ).toBe(true);
    expect(
      hasDuplicateExercise(exercises, { divisionId: 'pull', exerciseId: 'bench' }),
    ).toBe(false);
    expect(hasDuplicateOrder(exercises, { divisionId: 'push', order: 1 })).toBe(true);
    expect(hasDuplicateOrder(exercises, { divisionId: 'pull', order: 1 })).toBe(false);
  });

  it('sorts by division order and moves only inside the selected division', () => {
    const exercises = [
      exercise('triceps', 'push', 'Tríceps', 99, 2),
      exercise('row', 'pull', 'Remada', 1, 1),
      exercise('bench', 'push', 'Supino', 1, 2),
    ];
    expect(sortWorkoutExercises(exercises).map(({ id }) => id)).toEqual([
      'row',
      'bench',
      'triceps',
    ]);
    expect(moveWorkoutExercise(exercises, 'triceps', 'up')).toEqual([
      { id: 'triceps', divisionId: 'push', documentId: 'triceps', order: 1 },
      { id: 'bench', divisionId: 'push', documentId: 'bench', order: 2 },
    ]);
  });
});
