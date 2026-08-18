import type { WorkoutDivision } from '@/features/workout-divisions/domain/workout-division';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';

import { mapWorkoutPlanItemDocument } from './workout-plan-item.mapper';

const division: WorkoutDivision = {
  id: 'push',
  name: 'Push',
  order: 1,
  active: true,
  sourceSchemaVersion: 2,
};

const item = {
  exerciseId: 'bench-catalog',
  exerciseDocumentId: 'auto-id',
  exerciseNameSnapshot: 'Supino',
  defaultSets: 3,
  order: 1,
  active: true,
  schemaVersion: 2,
};

describe('mapWorkoutPlanItemDocument', () => {
  it('maps the nested path and both catalog identities', () => {
    expect(mapWorkoutPlanItemDocument(division, 'auto-id', item)).toEqual({
      id: 'push__auto-id',
      documentId: 'auto-id',
      divisionId: 'push',
      division: 'Push',
      divisionOrder: 1,
      exerciseId: 'bench-catalog',
      exerciseDocumentId: 'auto-id',
      name: 'Supino',
      defaultSets: 3,
      order: 1,
      sourceSchemaVersion: 2,
    });
  });

  it('hides inactive divisions and inactive plan items', () => {
    expect(
      mapWorkoutPlanItemDocument({ ...division, active: false }, 'auto-id', item),
    ).toBeNull();
    expect(
      mapWorkoutPlanItemDocument(division, 'auto-id', { ...item, active: false }),
    ).toBeNull();
  });

  it('rejects incomplete references', () => {
    expect(() => mapWorkoutPlanItemDocument(division, 'invalid', {})).toThrow(
      InvalidFirestoreDocumentError,
    );
  });
});
