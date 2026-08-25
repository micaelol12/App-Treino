import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { mapWorkoutDivisionDocument } from './workout-division.mapper';

describe('mapWorkoutDivisionDocument', () => {
  it('maps v2 metadata and identity', () => {
    const createdAt = new Date('2026-08-17T12:00:00.000Z');
    expect(
      mapWorkoutDivisionDocument('push', {
        name: 'Push',
        order: 1,
        active: true,
        schemaVersion: 2,
        createdAt: { toDate: () => createdAt },
      }),
    ).toEqual({
      id: 'push',
      name: 'Push',
      order: 1,
      active: true,
      sourceSchemaVersion: 2,
      createdAt,
    });
  });

  it('rejects unsupported versions', () => {
    expect(() =>
      mapWorkoutDivisionDocument('legacy', {
        name: 'Push',
        order: 1,
        active: true,
        schemaVersion: 1,
      }),
    ).toThrow(InvalidFirestoreDocumentError);
  });

  it('maps complete import provenance metadata', () => {
    const importedAt = new Date('2026-08-24T12:00:00.000Z');
    expect(
      mapWorkoutDivisionDocument('push', {
        name: 'Push',
        order: 1,
        active: true,
        schemaVersion: 2,
        sourceTemplateId: 'template-push',
        sourceTemplateVersion: 3,
        importedAt: { toDate: () => importedAt },
      }),
    ).toMatchObject({
      sourceTemplateId: 'template-push',
      sourceTemplateVersion: 3,
      importedAt,
    });
  });
});
