import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import type {
  ExerciseOrderUpdate,
  WorkoutExerciseDraft,
} from '../domain/workout-plan-rules';

import { WorkoutPlanFailure } from './workout-plan-failure';
import type { WorkoutPlanRepository } from './workout-plan-repository';
import { WorkoutPlanService } from './workout-plan-service';

class FakeWorkoutPlanRepository implements WorkoutPlanRepository {
  exercises: WorkoutPlanExercise[] = [];
  readonly create = jest.fn(
    async (_userId: string, _draft: WorkoutExerciseDraft) => 'new-id',
  );
  readonly update = jest.fn(async () => undefined);
  readonly delete = jest.fn(async () => undefined);
  readonly updateOrder = jest.fn(
    async (_userId: string, _updates: readonly ExerciseOrderUpdate[]) => undefined,
  );

  async list() {
    return this.exercises;
  }
}

const planExercise = (id: string, name: string, order: number): WorkoutPlanExercise => ({
  id,
  division: 'Push',
  name,
  defaultSets: 3,
  order,
  sourceSchemaVersion: 0,
});

const draft = {
  division: 'Push',
  name: 'Supino',
  defaultSets: 3,
  order: 1,
};

describe('WorkoutPlanService', () => {
  it('lists exercises in domain order', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [
      planExercise('2', 'Tríceps', 2),
      planExercise('1', 'Supino', 1),
    ];

    await expect(new WorkoutPlanService(repository).list('user')).resolves.toEqual([
      repository.exercises[1],
      repository.exercises[0],
    ]);
  });

  it('normalizes and creates a unique exercise', async () => {
    const repository = new FakeWorkoutPlanRepository();
    const service = new WorkoutPlanService(repository);

    await expect(
      service.create('user', { ...draft, division: ' Push ', name: ' Supino ' }),
    ).resolves.toBe('new-id');
    expect(repository.create).toHaveBeenCalledWith('user', draft);
  });

  it('rejects duplicate creation and update', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [planExercise('existing', 'Supino', 1)];
    const service = new WorkoutPlanService(repository);

    await expect(service.create('user', draft)).rejects.toMatchObject({
      code: 'duplicate',
    });
    await expect(service.update('user', 'other', draft)).rejects.toBeInstanceOf(
      WorkoutPlanFailure,
    );
  });

  it('rejects a repeated order in the same division', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [planExercise('existing', 'Crucifixo', 1)];

    await expect(
      new WorkoutPlanService(repository).create('user', draft),
    ).rejects.toMatchObject({ code: 'duplicate-order' });
  });

  it('updates the selected ID while ignoring itself in duplicate validation', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [planExercise('existing', 'Supino', 1)];

    await new WorkoutPlanService(repository).update('user', 'existing', draft);

    expect(repository.update).toHaveBeenCalledWith('user', 'existing', draft);
  });

  it('rejects an update that duplicates another exercise in the division', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [
      planExercise('existing', 'Supino', 1),
      planExercise('other', 'Crucifixo', 2),
    ];

    await expect(
      new WorkoutPlanService(repository).update('user', 'other', draft),
    ).rejects.toMatchObject({ code: 'duplicate' });
  });

  it('deletes by document ID', async () => {
    const repository = new FakeWorkoutPlanRepository();

    await new WorkoutPlanService(repository).delete('user', 'exercise-id');

    expect(repository.delete).toHaveBeenCalledWith('user', 'exercise-id');
  });

  it('persists reorder changes and rejects an unknown ID', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [
      planExercise('1', 'Supino', 1),
      planExercise('2', 'Tríceps', 2),
    ];
    const service = new WorkoutPlanService(repository);

    await service.move('user', '2', 'up');
    expect(repository.updateOrder).toHaveBeenCalledWith('user', [
      { id: '2', order: 1 },
      { id: '1', order: 2 },
    ]);
    await expect(service.move('user', 'missing', 'up')).rejects.toMatchObject({
      code: 'not-found',
    });
  });
});
