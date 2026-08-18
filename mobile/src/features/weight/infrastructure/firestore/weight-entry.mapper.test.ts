import { InvalidFirestoreDocumentError } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';
import { mapWeightEntryDocument } from './weight-entry.mapper';

describe('mapWeightEntryDocument', () => {
  it('maps a legacy weight entry', () => {
    expect(
      mapWeightEntryDocument('weight-1', {
        Data: '2026-07-01',
        Peso: 79.6,
      }),
    ).toEqual({
      id: 'weight-1',
      recordedOn: '2026-07-01',
      weightKg: 79.6,
      sourceSchemaVersion: 0,
    });
  });

  it.each([
    [{ Data: '2026-02-30', Peso: 79.6 }],
    [{ Data: '2026-07-01', Peso: 29.9 }],
    [{ Data: '2026-07-01', Peso: 79.6, extra: 'not allowed' }],
  ])('rejects an invalid weight entry', (data) => {
    expect(() => mapWeightEntryDocument('invalid-weight', data)).toThrow(
      InvalidFirestoreDocumentError,
    );
  });
});
