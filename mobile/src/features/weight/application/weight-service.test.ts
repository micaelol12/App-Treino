import { WeightService } from './weight-service';
import type { WeightRepository } from './weight-repository';

describe('WeightService', () => {
  it('validates and forwards a deterministic upsert', async () => {
    const repository: jest.Mocked<WeightRepository> = {
      listPage: jest.fn(),
      upsert: jest.fn().mockResolvedValue(undefined),
      replace: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WeightService(repository);

    await service.upsert('user-1', { recordedOn: '2026-08-15', weightKg: 79.6 });

    expect(repository.upsert).toHaveBeenCalledWith('user-1', {
      recordedOn: '2026-08-15',
      weightKg: 79.6,
    });
  });

  it('validates replacement and forwards deletion', async () => {
    const repository: jest.Mocked<WeightRepository> = {
      listPage: jest.fn(),
      upsert: jest.fn(),
      replace: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WeightService(repository);

    await service.replace('user-1', 'old-id', {
      recordedOn: '2026-08-16',
      weightKg: 78.4,
    });
    await service.delete('user-1', 'old-id');

    expect(repository.replace).toHaveBeenCalledWith('user-1', 'old-id', {
      recordedOn: '2026-08-16',
      weightKg: 78.4,
    });
    expect(repository.delete).toHaveBeenCalledWith('user-1', 'old-id');
  });
});
