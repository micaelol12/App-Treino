import { workoutExerciseFormSchema } from './workout-exercise-form.schema';

describe('workoutExerciseFormSchema', () => {
  it('accepts a valid form', () => {
    expect(
      workoutExerciseFormSchema.parse({
        division: 'Push',
        name: 'Supino',
        defaultSets: '3',
        order: '1',
      }),
    ).toEqual({ division: 'Push', name: 'Supino', defaultSets: '3', order: '1' });
  });

  it.each([
    { division: '', name: 'Supino', defaultSets: '3', order: '1' },
    { division: 'Push', name: '', defaultSets: '3', order: '1' },
    { division: 'Push', name: 'Supino', defaultSets: '0', order: '1' },
    { division: 'Push', name: 'Supino', defaultSets: '3.5', order: '1' },
    { division: 'Push', name: 'Supino', defaultSets: '3', order: '1000' },
  ])('rejects an invalid form', (values) => {
    expect(workoutExerciseFormSchema.safeParse(values).success).toBe(false);
  });
});
