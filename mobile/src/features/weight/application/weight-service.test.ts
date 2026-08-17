import { WeightService } from './weight-service';
import type { WeightRepository } from './weight-repository';

describe('WeightService', () => {
  it('validates and forwards a deterministic upsert', async () => {
    const repository: jest.Mocked<WeightRepository> = {
      listPage: jest.fn(),
      upsert: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WeightService(repository);

    await service.upsert('user-1', { recordedOn: '2026-08-15', weightKg: 79.6 });

    expect(repository.upsert).toHaveBeenCalledWith('user-1', {
      recordedOn: '2026-08-15',
      weightKg: 79.6,
    });
  });
});
