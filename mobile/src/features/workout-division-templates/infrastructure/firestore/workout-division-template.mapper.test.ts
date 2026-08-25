import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import {
  mapWorkoutDivisionTemplateDocument,
  mapWorkoutDivisionTemplateExerciseDocument,
} from './workout-division-template.mapper';

const timestamp = { toDate: () => new Date('2026-08-24T12:00:00.000Z') };

describe('workout division template mappers', () => {
  it('maps a published template and one catalog-backed exercise', () => {
    expect(
      mapWorkoutDivisionTemplateDocument('push', {
        name: 'Push pronto',
        description: 'Peito, ombros e tríceps.',
        level: 'Intermediário',
        goal: 'Hipertrofia',
        status: 'published',
        displayOrder: 1,
        exerciseCount: 1,
        version: 2,
        schemaVersion: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        publishedAt: timestamp,
      }),
    ).toMatchObject({ id: 'push', name: 'Push pronto', version: 2 });
    expect(
      mapWorkoutDivisionTemplateExerciseDocument('bench-document', {
        exerciseId: 'bench',
        exerciseDocumentId: 'bench-document',
        exerciseNameSnapshot: 'Supino reto',
        defaultSets: 3,
        order: 1,
        schemaVersion: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    ).toEqual({
      exerciseId: 'bench',
      exerciseDocumentId: 'bench-document',
      exerciseNameSnapshot: 'Supino reto',
      defaultSets: 3,
      order: 1,
    });
  });

  it('rejects drafts and unexpected fields in the mobile catalog', () => {
    expect(() =>
      mapWorkoutDivisionTemplateDocument('draft', {
        name: 'Draft',
        description: '',
        level: '',
        goal: '',
        status: 'draft',
        displayOrder: 0,
        exerciseCount: 1,
        version: 1,
        schemaVersion: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        publishedAt: timestamp,
      }),
    ).toThrow(InvalidFirestoreDocumentError);
  });
});
