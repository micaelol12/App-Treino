import type { WorkoutPlanExercise } from '../domain/workout-plan-exercise';
import type {
  ExerciseOrderUpdate,
  WorkoutExerciseDraft,
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
): WorkoutPlanExercise => ({
  id,
  documentId: `doc-${exerciseId}`,
  divisionId: 'push',
  division: 'Push',
  divisionOrder: 1,
  exerciseId,
  exerciseDocumentId: `doc-${exerciseId}`,
  name: exerciseId,
  defaultSets: 3,
  order,
  sourceSchemaVersion: 2,
});

const draft: WorkoutExerciseDraft = {
  divisionId: 'push',
  divisionNameSnapshot: 'Push',
  exerciseId: 'bench',
  exerciseDocumentId: 'doc-bench',
  exerciseNameSnapshot: 'Supino',
  defaultSets: 3,
  order: 1,
};

describe('WorkoutPlanService v2', () => {
  it('creates a unique catalog reference', async () => {
    const repository = new FakeWorkoutPlanRepository();
    await expect(new WorkoutPlanService(repository).create('user', draft)).resolves.toBe(
      'division__exercise',
    );
    expect(repository.create).toHaveBeenCalledWith('user', draft);
  });

  it('rejects duplicate exercise and duplicate order in one division', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [planExercise('existing', 'bench', 1)];
    const service = new WorkoutPlanService(repository);
    await expect(service.create('user', draft)).rejects.toMatchObject({
      code: 'duplicate',
    });
    await expect(
      service.create('user', {
        ...draft,
        exerciseId: 'fly',
        exerciseDocumentId: 'doc-fly',
      }),
    ).rejects.toMatchObject({ code: 'duplicate-order' });
  });

  it('passes the resolved current item to update and delete', async () => {
    const repository = new FakeWorkoutPlanRepository();
    const existing = planExercise('existing', 'bench', 1);
    repository.exercises = [existing];
    const service = new WorkoutPlanService(repository);

    await service.update('user', existing.id, draft);
    expect(repository.update).toHaveBeenCalledWith('user', existing, draft);
    await service.delete('user', existing.id);
    expect(repository.delete).toHaveBeenCalledWith('user', existing);
  });

  it('persists reorder paths and rejects an unknown ID', async () => {
    const repository = new FakeWorkoutPlanRepository();
    repository.exercises = [
      planExercise('first', 'bench', 1),
      planExercise('second', 'triceps', 2),
    ];
    const service = new WorkoutPlanService(repository);
    await service.move('user', 'second', 'up');
    expect(repository.updateOrder).toHaveBeenCalledWith('user', [
      { id: 'second', divisionId: 'push', documentId: 'doc-triceps', order: 1 },
      { id: 'first', divisionId: 'push', documentId: 'doc-bench', order: 2 },
    ]);
    await expect(service.move('user', 'missing', 'up')).rejects.toMatchObject({
      code: 'not-found',
    });
  });
});
