import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ExerciseCatalogSnapshot } from '../application/exercise-catalog-repository';
import { CachedExerciseCatalogRepository } from './cached-exercise-catalog.repository';
import { AsyncStorageExerciseCatalogDataSource } from './local/async-storage-exercise-catalog';

const taxonomies = {
  equipamentos: [{ id: 'barra', name: 'Barra', active: true, order: 1 }],
  categorias: [],
  forcas: [],
  niveis: [{ id: 'iniciante', name: 'Iniciante', active: true, order: 1 }],
  mecanicas: [],
  musculos: [{ id: 'peito', name: 'Peito', active: true, order: 1 }],
} as const;

function snapshot(name = 'Supino'): ExerciseCatalogSnapshot {
  return {
    syncedAt: '2026-08-17T12:00:00.000Z',
    taxonomies,
    exercises: [
      {
        documentId: 'physical-bench',
        id: 'bench',
        name,
        force: null,
        level: 'iniciante',
        mechanic: null,
        equipment: 'barra',
        primaryMuscles: ['peito'],
        secondaryMuscles: [],
        instructions: [],
        category: 'força',
        images: [],
      },
    ],
  };
}

describe('CachedExerciseCatalogRepository', () => {
  beforeEach(async () => AsyncStorage.clear());

  it('downloads once and serves subsequent starts from local storage', async () => {
    const download = jest.fn().mockResolvedValue(snapshot());
    const local = new AsyncStorageExerciseCatalogDataSource();
    const first = new CachedExerciseCatalogRepository(local, { download });
    expect(await first.ensureAvailable()).toEqual(snapshot());

    const secondDownload = jest.fn();
    const second = new CachedExerciseCatalogRepository(local, {
      download: secondDownload,
    });
    expect(await second.ensureAvailable()).toEqual(snapshot());
    expect(download).toHaveBeenCalledTimes(1);
    expect(secondDownload).not.toHaveBeenCalled();
  });

  it('preserves the previous snapshot when manual synchronization fails', async () => {
    const local = new AsyncStorageExerciseCatalogDataSource();
    await local.save(snapshot());
    const repository = new CachedExerciseCatalogRepository(local, {
      download: jest.fn().mockRejectedValue(new Error('offline')),
    });

    await expect(repository.synchronize()).rejects.toThrow('offline');
    expect(await repository.getLocal()).toEqual(snapshot());
  });
});
