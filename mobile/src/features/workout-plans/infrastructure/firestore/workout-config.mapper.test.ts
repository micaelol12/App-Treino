import { InvalidFirestoreDocumentError } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';
import {
  LEGACY_FALLBACK_EXERCISE_ORDER,
  mapWorkoutConfigDocument,
} from './workout-config.mapper';

describe('mapWorkoutConfigDocument', () => {
  it('maps and normalizes a legacy document', () => {
    expect(
      mapWorkoutConfigDocument('exercise-1', {
        Divisao: ' Push ',
        Exercicio: ' Supino Reto ',
        Series_Padrao: 3,
      }),
    ).toEqual({
      id: 'legacy:exercise-1',
      documentId: 'exercise-1',
      divisionId: 'legacy:Push',
      division: 'Push',
      divisionOrder: 999,
      exerciseId: 'legacy:exercise-1',
      name: 'Supino Reto',
      defaultSets: 3,
      order: LEGACY_FALLBACK_EXERCISE_ORDER,
      sourceSchemaVersion: 0,
    });
  });

  it('maps versioned metadata without leaking the Firestore timestamp', () => {
    const createdAt = new Date('2026-08-14T12:00:00.000Z');

    const result = mapWorkoutConfigDocument('exercise-2', {
      Divisao: 'Pull',
      Exercicio: 'Remada',
      Series_Padrao: 4,
      Ordem: 2,
      schemaVersion: 1,
      createdAt: { toDate: () => createdAt },
    });

    expect(result.sourceSchemaVersion).toBe(1);
    expect(result.createdAt).toEqual(createdAt);
    expect(result.order).toBe(2);
  });

  it.each([
    [{ Divisao: '', Exercicio: 'Supino', Series_Padrao: 3 }],
    [{ Divisao: 'Push', Exercicio: 'Supino', Series_Padrao: 0 }],
    [
      {
        Divisao: 'Push',
        Exercicio: 'Supino',
        Series_Padrao: 3,
        campo_desconhecido: true,
      },
    ],
  ])('rejects an invalid config document', (data) => {
    expect(() => mapWorkoutConfigDocument('invalid-id', data)).toThrow(
      InvalidFirestoreDocumentError,
    );
  });
});
