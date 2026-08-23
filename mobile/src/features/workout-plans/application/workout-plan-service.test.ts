import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import type {
  ExerciseOrderUpdate,
  WorkoutExerciseInput,
} from '../domain/workout-plan-rules';

import type { WorkoutPlanRepository } from './workout-plan-repository';
import { WorkoutPlanService } from './workout-plan-service';

class FakeWorkoutPlanRepository implements WorkoutPlanRepository {
  exercises: WorkoutPlanExercise[] = [];
  readonly create = jest.fn(async () => 'division__exercise');
  readonly update = jest.fn(async () => undefined);
  readonly delete = jest.fn(async () => undefined);
  readonly updateOrder = jest.fn(
    async (_userId: string, _updates: readonly ExerciseOrderUpdate[]) => undefined,
  );
  async list() {
    return this.exercises;
  }
}

const planExercise = (
  id: string,
  exerciseId: string,
  order: number,
  divisionId = 'push',
): WorkoutPlanExercise => ({
  id,
  documentId: `doc-${exerciseId}`,
  divisionId,
  division: divisionId === 'push' ? 'Push' : 'Pull',
  divisionOrder: divisionId === 'push' ? 1 : 2,
  exerciseId,
  exerciseDocumentId: `doc-${exerciseId}`,
  name: exerciseId,
  defaultSets: 3,
  order,
  sourceSchemaVersion: 2,
});

const input: WorkoutExerciseInput = {
  divisionId: 'push',
  divisionNameSnapshot: 'Push',
  exerciseId: 'bench',
  exerciseDocumentId: 'doc-bench',
  exerciseNameSnapshot: 'Supino',
  defaultSets: 3,
};

describe('WorkoutPlanService v2', () => {
  it('creates the first exercise at order 1', async () => {
    const repository = new FakeWorkoutPlanRepository();
    await expect(new WorkoutPlanService(repository).create('user', input)).resolves.toBe(
      'division__exercise',
    );
    expect(repository.create).toHaveBeenCalledWith('user', { ...input, order: 1 });
  });

  it('appends after the greatest order only in the selected division', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [
      planExercise('first', 'bench', 1),
      planExercise('second', 'triceps', 5),
      planExercise('other', 'row', 99, 'pull'),
    ];
    await new WorkoutPlanService(repository).create('user', {
      ...input,
      exerciseId: 'fly',
      exerciseDocumentId: 'doc-fly',
    });
    expect(repository.create).toHaveBeenCalledWith('user', {
      ...input,
      exerciseId: 'fly',
      exerciseDocumentId: 'doc-fly',
      order: 6,
    });
  });

  it('keeps duplicate exercise protection', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [planExercise('existing', 'bench', 1)];
    await expect(
      new WorkoutPlanService(repository).create('user', input),
    ).rejects.toMatchObject({ code: 'duplicate' });
  });

  it('preserves order in the same division and appends when changing division', async () => {
    const repository = new FakeWorkoutPlanRepository();
    const existing = planExercise('existing', 'bench', 4);
    repository.exercises = [existing, planExercise('row', 'row', 5, 'pull')];
    const service = new WorkoutPlanService(repository);

    await service.update('user', existing.id, input);
    expect(repository.update).toHaveBeenLastCalledWith('user', existing, {
      ...input,
      order: 4,
    });

    const movedInput = {
      ...input,
      divisionId: 'pull',
      divisionNameSnapshot: 'Pull',
    };
    await service.update('user', existing.id, movedInput);
    expect(repository.update).toHaveBeenLastCalledWith('user', existing, {
      ...movedInput,
      order: 6,
    });
  });

  it('passes the resolved current item to delete', async () => {
    const repository = new FakeWorkoutPlanRepository();
    const existing = planExercise('existing', 'bench', 1);
    repository.exercises = [existing];
    await new WorkoutPlanService(repository).delete('user', existing.id);
    expect(repository.delete).toHaveBeenCalledWith('user', existing);
  });

  it('persists reordered paths and skips an unchanged sequence', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [
      planExercise('first', 'bench', 1),
      planExercise('second', 'triceps', 2),
    ];
    const service = new WorkoutPlanService(repository);
    await service.reorder('user', 'push', ['second', 'first']);
    expect(repository.updateOrder).toHaveBeenCalledWith('user', [
      { id: 'second', divisionId: 'push', documentId: 'doc-triceps', order: 1 },
      { id: 'first', divisionId: 'push', documentId: 'doc-bench', order: 2 },
    ]);

    repository.updateOrder.mockClear();
    await service.reorder('user', 'push', ['first', 'second']);
    expect(repository.updateOrder).not.toHaveBeenCalled();
  });
});
