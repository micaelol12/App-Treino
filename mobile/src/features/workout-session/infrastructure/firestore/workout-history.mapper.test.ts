import { InvalidFirestoreDocumentError } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';
import { mapWorkoutHistoryDocument } from './workout-history.mapper';

const validLegacyHistory = {
  Data: '2026-07-01',
  Treino: 'Push',
  Exercício: 'Supino Reto',
  Série: 1,
  Carga: 60,
  Reps: 10,
  RPE: 8,
  Obs: '',
};

describe('mapWorkoutHistoryDocument', () => {
  it('maps all legacy Portuguese field names into the domain', () => {
    expect(mapWorkoutHistoryDocument('set-1', validLegacyHistory)).toEqual({
      id: 'set-1',
      performedOn: '2026-07-01',
      workoutName: 'Push',
      exerciseName: 'Supino Reto',
      setNumber: 1,
      loadKg: 60,
      repetitions: 10,
      rpe: 8,
      note: '',
      sourceSchemaVersion: 0,
    });
  });

  it('maps a versioned session id', () => {
    const result = mapWorkoutHistoryDocument('set-2', {
      ...validLegacyHistory,
      sessionId: 'session-2026-07-01',
      schemaVersion: 1,
    });

    expect(result.sessionId).toBe('session-2026-07-01');
    expect(result.sourceSchemaVersion).toBe(1);
  });

  it.each([
    [{ ...validLegacyHistory, Data: '2026-02-30' }],
    [{ ...validLegacyHistory, Reps: 0 }],
    [{ ...validLegacyHistory, RPE: 11 }],
    [{ ...validLegacyHistory, Carga: -1 }],
  ])('rejects an invalid history document', (data) => {
    expect(() => mapWorkoutHistoryDocument('invalid-set', data)).toThrow(
      InvalidFirestoreDocumentError,
    );
  });
});
