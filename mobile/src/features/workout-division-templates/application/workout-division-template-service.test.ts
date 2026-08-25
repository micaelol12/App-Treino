import type { WorkoutDivisionRepository } from '@/features/workout-divisions/application/workout-division-repository';
import type {
  DivisionOrderUpdate,
  WorkoutDivision,
  WorkoutDivisionDraft,
} from '@/features/workout-divisions/domain/workout-division';

import type { WorkoutDivisionTemplateRepository } from './workout-division-template-repository';
import { WorkoutDivisionTemplateService } from './workout-division-template-service';
import type { WorkoutDivisionTemplateDetails } from '../domain/workout-division-template';

const template: WorkoutDivisionTemplateDetails = {
  id: 'push-template',
  name: 'Push pronto',
  description: 'Peito, ombros e tríceps.',
  level: 'Intermediário',
  goal: 'Hipertrofia',
  displayOrder: 1,
  exerciseCount: 1,
  version: 3,
  exercises: [
    {
      exerciseId: 'bench',
      exerciseDocumentId: 'bench-document',
      exerciseNameSnapshot: 'Supino reto',
      defaultSets: 3,
      order: 1,
    },
  ],
};

class FakeTemplateRepository implements WorkoutDivisionTemplateRepository {
  details = template;
  readonly importToUser = jest.fn(async () => 'imported-division');
  async listPublished() {
    return [this.details];
  }
  async getPublished() {
    return this.details;
  }
}

class FakeDivisionRepository implements WorkoutDivisionRepository {
  divisions: WorkoutDivision[] = [];
  async list() {
    return this.divisions;
  }
  async create(_userId: string, _draft: WorkoutDivisionDraft) {
    return 'division';
  }
  async delete() {}
  async update() {}
  async updateOrder(_userId: string, _updates: readonly DivisionOrderUpdate[]) {}
}

function division(name: string, order: number): WorkoutDivision {
  return {
    id: name.toLocaleLowerCase('pt-BR'),
    name,
    order,
    active: true,
    sourceSchemaVersion: 2,
  };
}

describe('WorkoutDivisionTemplateService', () => {
  it('imports a normalized editable copy after the last user division', async () => {
    const templates = new FakeTemplateRepository();
    const divisions = new FakeDivisionRepository();
    divisions.divisions = [division('Pull', 4)];
    const service = new WorkoutDivisionTemplateService(templates, divisions);

    await expect(
      service.importToUser('user', template.id, '  Push   personalizado  '),
    ).resolves.toBe('imported-division');
    expect(templates.importToUser).toHaveBeenCalledWith(
      'user',
      template,
      'Push personalizado',
      5,
    );
  });

  it('rejects a normalized duplicate without writing', async () => {
    const templates = new FakeTemplateRepository();
    const divisions = new FakeDivisionRepository();
    divisions.divisions = [division('Push Á', 1)];
    const service = new WorkoutDivisionTemplateService(templates, divisions);

    await expect(
      service.importToUser('user', template.id, 'push a'),
    ).rejects.toMatchObject({ code: 'duplicate' });
    expect(templates.importToUser).not.toHaveBeenCalled();
  });

  it('rejects a published template without exercises', async () => {
    const templates = new FakeTemplateRepository();
    templates.details = { ...template, exerciseCount: 0, exercises: [] };
    const service = new WorkoutDivisionTemplateService(
      templates,
      new FakeDivisionRepository(),
    );

    await expect(
      service.importToUser('user', template.id, template.name),
    ).rejects.toMatchObject({ code: 'unavailable' });
  });
});
