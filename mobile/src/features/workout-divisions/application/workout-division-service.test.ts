import type { WorkoutDivision, WorkoutDivisionDraft } from '../domain/workout-division';

import type { WorkoutDivisionRepository } from './workout-division-repository';
import { WorkoutDivisionService } from './workout-division-service';

class FakeRepository implements WorkoutDivisionRepository {
  divisions: WorkoutDivision[] = [];
  readonly create = jest.fn(async () => 'division-id');
  readonly update = jest.fn(async () => undefined);
  async list() {
    return this.divisions;
  }
}

const draft: WorkoutDivisionDraft = { name: 'Push A', order: 1, active: true };

describe('WorkoutDivisionService', () => {
  it('creates a normalized unique division', async () => {
    const repository = new FakeRepository();
    await new WorkoutDivisionService(repository).create('user', {
      ...draft,
      name: '  Push   A ',
    });
    expect(repository.create).toHaveBeenCalledWith('user', draft);
  });

  it('rejects normalized duplicate names and orders', async () => {
    const repository = new FakeRepository();
    repository.divisions = [
      {
        id: 'push',
        name: 'Push A',
        order: 1,
        active: true,
        sourceSchemaVersion: 2,
      },
    ];
    const service = new WorkoutDivisionService(repository);
    await expect(
      service.create('user', { ...draft, name: 'push á' }),
    ).rejects.toMatchObject({ code: 'duplicate' });
    await expect(
      service.create('user', { ...draft, name: 'Pull', order: 1 }),
    ).rejects.toMatchObject({ code: 'duplicate-order' });
  });
});
