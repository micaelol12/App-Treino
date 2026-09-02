import { workoutExerciseFormSchema } from './workout-exercise-form.schema';

describe('workoutExerciseFormSchema', () => {
  it('accepts a valid form', () => {
    expect(
      workoutExerciseFormSchema.parse({
        divisionId: 'push',
        exerciseDocumentId: 'exercise-document',
        defaultSets: '3',
      }),
    ).toEqual({
      divisionId: 'push',
      exerciseDocumentId: 'exercise-document',
      defaultSets: '3',
    });
  });

  it.each([
    { divisionId: '', exerciseDocumentId: 'doc', defaultSets: '3' },
    { divisionId: 'push', exerciseDocumentId: '', defaultSets: '3' },
    { divisionId: 'push', exerciseDocumentId: 'doc', defaultSets: '0' },
    { divisionId: 'push', exerciseDocumentId: 'doc', defaultSets: '3.5' },
  ])('rejects an invalid form', (values) => {
    expect(workoutExerciseFormSchema.safeParse(values).success).toBe(false);
  });

  it('does not include a manual order field', () => {
    expect(workoutExerciseFormSchema.keyof().options).not.toContain('order');
  });
});
