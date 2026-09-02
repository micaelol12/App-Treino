import type { Exercise } from './exercise';
import {
  calculateExerciseSimilarity,
  createMuscleWeightMap,
  findCatalogExercise,
  rankEquivalentExercises,
} from './exercise-equivalence';

function exercise(
  documentId: string,
  name: string,
  primaryMuscles: readonly string[],
  secondaryMuscles: readonly string[] = [],
  override: Partial<Exercise> = {},
): Exercise {
  return {
    documentId,
    id: `${documentId}-id`,
    name,
    force: null,
    level: 'iniciante',
    mechanic: null,
    equipment: null,
    primaryMuscles,
    secondaryMuscles,
    instructions: [],
    category: 'forca',
    images: [],
    ...override,
  };
}

describe('exercise equivalence', () => {
  const source = exercise('bench', 'Supino', ['peito'], ['triceps', 'ombros']);

  it('weights primary muscles more and lets primary override a duplicate secondary', () => {
    expect([
      ...createMuscleWeightMap(exercise('duplicate', 'Duplicado', ['peito'], ['peito'])),
    ]).toEqual([['peito', 3]]);
    expect(calculateExerciseSimilarity(source, source)).toBe(1);
    expect(
      calculateExerciseSimilarity(
        source,
        exercise('partial', 'Parcial', ['peito'], ['ombros']),
      ),
    ).toBe(0.8);
    expect(
      calculateExerciseSimilarity(
        exercise('empty-a', 'Vazio A', []),
        exercise('empty-b', 'Vazio B', []),
      ),
    ).toBe(0);
  });

  it('requires a shared primary muscle and filters current, inactive and excluded exercises', () => {
    const exact = exercise('exact', 'Supino máquina', ['peito'], ['triceps', 'ombros']);
    const inactive = exercise('inactive', 'Supino inativo', ['peito'], [], {
      active: false,
    });
    const shifted = exercise(
      'shifted',
      'Tríceps no banco',
      ['triceps'],
      ['peito', 'ombros'],
    );
    const excludedById = exercise('excluded-id', 'Crucifixo', ['peito']);

    const result = rankEquivalentExercises(
      source,
      [source, exact, inactive, shifted, excludedById],
      { excludedExerciseIds: new Set([excludedById.id]) },
    );

    expect(result.map(({ exercise: item }) => item.documentId)).toEqual(['exact']);
    expect(result[0]).toEqual(
      expect.objectContaining({
        similarity: 1,
        sharedPrimaryMuscles: ['peito'],
        sharedOtherMuscles: ['triceps', 'ombros'],
      }),
    );
  });

  it('orders by weighted similarity and applies stable tie breakers and limit', () => {
    const candidates = [
      exercise('z', 'Zeta', ['peito'], ['biceps']),
      exercise('a', 'Alfa', ['peito'], ['biceps']),
      exercise('close', 'Mais próximo', ['peito'], ['triceps', 'ombros']),
    ];

    expect(
      rankEquivalentExercises(source, candidates, { limit: 2 }).map(
        ({ exercise: item }) => item.documentId,
      ),
    ).toEqual(['close', 'a']);
    expect(rankEquivalentExercises(source, candidates, { limit: -1 })).toEqual([]);
  });

  it('resolves catalog identity in document, logical id and legacy name order', () => {
    const duplicateName = exercise('other', 'Supino', ['peito']);
    const catalog = [duplicateName, source];

    expect(
      findCatalogExercise(catalog, {
        exerciseDocumentId: source.documentId,
        exerciseId: duplicateName.id,
        exerciseName: duplicateName.name,
      }),
    ).toBe(source);
    expect(
      findCatalogExercise(catalog, {
        exerciseDocumentId: 'missing',
        exerciseId: source.id,
        exerciseName: duplicateName.name,
      }),
    ).toBe(source);
    expect(
      findCatalogExercise(catalog, {
        exerciseName: duplicateName.name,
      }),
    ).toBe(duplicateName);
    expect(
      findCatalogExercise(catalog, {
        exerciseName: 'Ausente',
      }),
    ).toBeUndefined();
  });
});
