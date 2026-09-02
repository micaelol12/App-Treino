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

const CATALOG_MANIFEST_KEY = 'app-treino-exercise-catalog-v1:manifest';

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

  it('keeps taxonomy metadata written by the previous cache format from invalidating it', async () => {
    const local = new AsyncStorageExerciseCatalogDataSource();
    await local.save(snapshot());
    const serialized = await AsyncStorage.getItem(CATALOG_MANIFEST_KEY);
    expect(serialized).not.toBeNull();

    const manifest = JSON.parse(serialized!);
    manifest.taxonomies.equipamentos[0].exerciseCount = 42;
    manifest.taxonomies.equipamentos[0].schemaVersion = 1;
    await AsyncStorage.setItem(CATALOG_MANIFEST_KEY, JSON.stringify(manifest));

    expect(await local.load()).toEqual(snapshot());
  });

  it('reclaims the previous generation and retries when SQLite is full', async () => {
    const local = new AsyncStorageExerciseCatalogDataSource();
    await local.save(snapshot());
    const previousManifest = JSON.parse(
      (await AsyncStorage.getItem(CATALOG_MANIFEST_KEY))!,
    );
    const previousChunkKeys = Array.from(
      { length: previousManifest.chunkCount },
      (_, index) =>
        `app-treino-exercise-catalog-v1:${previousManifest.generation}:exercises:${index}`,
    );
    const multiSet = AsyncStorage.multiSet as jest.MockedFunction<
      typeof AsyncStorage.multiSet
    >;
    multiSet.mockClear();
    multiSet.mockRejectedValueOnce([
      new Error('database or disk is full (code 13 SQLITE_FULL[13])'),
    ]);

    await local.save(snapshot('Agachamento'));

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(previousChunkKeys);
    expect(
      multiSet.mock.calls.filter(([entries]) =>
        entries.some(([key]) => key.includes(':exercises:')),
      ),
    ).toHaveLength(2);
    expect(await local.load()).toEqual(snapshot('Agachamento'));
  });

  it('removes orphaned catalog generations before writing a new snapshot', async () => {
    const local = new AsyncStorageExerciseCatalogDataSource();
    await local.save(snapshot());
    const orphanKey = 'app-treino-exercise-catalog-v1:failed-generation:exercises:0';
    await AsyncStorage.setItem(orphanKey, 'orphan');

    await local.save(snapshot('Levantamento terra'));

    expect(await AsyncStorage.getItem(orphanKey)).toBeNull();
    expect(await local.load()).toEqual(snapshot('Levantamento terra'));
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
