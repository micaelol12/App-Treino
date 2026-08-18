import { workoutExerciseFormSchema } from './workout-exercise-form.schema';

describe('workoutExerciseFormSchema', () => {
  it('accepts a valid form', () => {
    expect(
      workoutExerciseFormSchema.parse({
        divisionId: 'push',
        exerciseDocumentId: 'exercise-document',
        defaultSets: '3',
        order: '1',
      }),
    ).toEqual({
      divisionId: 'push',
      exerciseDocumentId: 'exercise-document',
      defaultSets: '3',
      order: '1',
    });
  });

  it.each([
    { divisionId: '', exerciseDocumentId: 'doc', defaultSets: '3', order: '1' },
    { divisionId: 'push', exerciseDocumentId: '', defaultSets: '3', order: '1' },
    { divisionId: 'push', exerciseDocumentId: 'doc', defaultSets: '0', order: '1' },
    { divisionId: 'push', exerciseDocumentId: 'doc', defaultSets: '3.5', order: '1' },
    { divisionId: 'push', exerciseDocumentId: 'doc', defaultSets: '3', order: '1000' },
  ])('rejects an invalid form', (values) => {
    expect(workoutExerciseFormSchema.safeParse(values).success).toBe(false);
  });
});
