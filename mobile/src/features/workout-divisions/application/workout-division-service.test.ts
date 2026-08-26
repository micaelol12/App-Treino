import type {
  DivisionOrderUpdate,
  WorkoutDivision,
  WorkoutDivisionInput,
} from '../domain/workout-division';

import type { WorkoutDivisionRepository } from './workout-division-repository';
import { WorkoutDivisionService } from './workout-division-service';

class FakeRepository implements WorkoutDivisionRepository {
  divisions: WorkoutDivision[] = [];
  readonly create = jest.fn(async () => 'division-id');
  readonly delete = jest.fn(async () => undefined);
  readonly update = jest.fn(async () => undefined);
  readonly updateOrder = jest.fn(
    async (_userId: string, _updates: readonly DivisionOrderUpdate[]) => undefined,
  );
  async list() {
    return this.divisions;
  }
}

const input: WorkoutDivisionInput = { name: 'Push A', active: true };
const division = (id: string, name: string, order: number): WorkoutDivision => ({
  id,
  name,
  order,
  active: true,
  sourceSchemaVersion: 2,
});

describe('WorkoutDivisionService', () => {
  it('normalizes a first division and assigns order 1', async () => {
    const repository = new FakeRepository();
    await new WorkoutDivisionService(repository).create('user', {
      ...input,
      name: '  Push   A ',
    });
    expect(repository.create).toHaveBeenCalledWith('user', { ...input, order: 1 });
  });

  it('appends after the greatest order even when there are gaps', async () => {
    const repository = new FakeRepository();
    repository.divisions = [division('push', 'Push', 1), division('pull', 'Pull', 5)];
    await new WorkoutDivisionService(repository).create('user', {
      name: 'Legs',
      active: true,
    });
    expect(repository.create).toHaveBeenCalledWith('user', {
      name: 'Legs',
      active: true,
      order: 6,
    });
  });

  it('rejects normalized duplicate names', async () => {
    const repository = new FakeRepository();
    repository.divisions = [division('push', 'Push A', 1)];
    await expect(
      new WorkoutDivisionService(repository).create('user', {
        ...input,
        name: 'push á',
      }),
    ).rejects.toMatchObject({ code: 'duplicate' });
  });

  it('preserves order when updating name or active state', async () => {
    const repository = new FakeRepository();
    repository.divisions = [division('push', 'Push', 5)];
    await new WorkoutDivisionService(repository).update('user', 'push', {
      name: 'Push A',
      active: false,
    });
    expect(repository.update).toHaveBeenCalledWith('user', 'push', {
      name: 'Push A',
      active: false,
      order: 5,
    });
  });

  it('removes an existing division and rejects a missing one', async () => {
    const repository = new FakeRepository();
    repository.divisions = [division('push', 'Push', 1)];
    const service = new WorkoutDivisionService(repository);

    await service.remove('user', 'push');
    expect(repository.delete).toHaveBeenCalledWith('user', 'push');

    await expect(service.remove('user', 'missing')).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('persists only changed contiguous reorder positions', async () => {
    const repository = new FakeRepository();
    repository.divisions = [division('push', 'Push', 1), division('pull', 'Pull', 2)];
    const service = new WorkoutDivisionService(repository);
    await service.reorder('user', ['pull', 'push']);
    expect(repository.updateOrder).toHaveBeenCalledWith('user', [
      { id: 'pull', order: 1 },
      { id: 'push', order: 2 },
    ]);

    repository.updateOrder.mockClear();
    await service.reorder('user', ['push', 'pull']);
    expect(repository.updateOrder).not.toHaveBeenCalled();
  });

  it('rejects an invalid reorder sequence', async () => {
    const repository = new FakeRepository();
    repository.divisions = [division('push', 'Push', 1), division('pull', 'Pull', 2)];
    await expect(
      new WorkoutDivisionService(repository).reorder('user', ['push']),
    ).rejects.toMatchObject({ code: 'invalid-sequence' });
  });

  it('persists a complete cached order without reading the repository', async () => {
    const repository = new FakeRepository();
    const cachedDivisions = [division('push', 'Push', 1), division('pull', 'Pull', 2)];
    const list = jest.spyOn(repository, 'list');

    await new WorkoutDivisionService(repository).reorder(
      'user',
      ['push', 'pull'],
      cachedDivisions,
    );

    expect(list).not.toHaveBeenCalled();
    expect(repository.updateOrder).toHaveBeenCalledWith('user', [
      { id: 'push', order: 1 },
      { id: 'pull', order: 2 },
    ]);
  });
});
