import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import {
  exerciseTaxonomyNames,
  type ExerciseCatalogSnapshot,
  type ExerciseTaxonomies,
} from '../../application/exercise-catalog-repository';
import { exerciseDocumentSchema } from '../firestore/exercise.schema';

const STORAGE_PREFIX = 'app-treino-exercise-catalog-v1';
const MANIFEST_KEY = `${STORAGE_PREFIX}:manifest`;
const CHUNK_SIZE = 100;

const taxonomyItemSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    active: z.boolean(),
    order: z.number().int().nonnegative(),
  })
  // Firestore taxonomy documents also carry catalog-maintenance metadata such
  // as schemaVersion and exerciseCount. It is not part of the mobile domain,
  // so strip it while loading instead of invalidating the whole offline cache.
  .strip();

const taxonomiesSchema = z.object(
  Object.fromEntries(
    exerciseTaxonomyNames.map((name) => [name, z.array(taxonomyItemSchema)]),
  ) as Record<
    (typeof exerciseTaxonomyNames)[number],
    z.ZodArray<typeof taxonomyItemSchema>
  >,
);

const storedExerciseSchema = exerciseDocumentSchema.extend({
  documentId: z.string().min(1),
});

const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    generation: z.string().min(1),
    chunkCount: z.number().int().positive(),
    exerciseCount: z.number().int().nonnegative(),
    syncedAt: z.string().datetime(),
    taxonomies: taxonomiesSchema,
  })
  .strict();

type Manifest = z.infer<typeof manifestSchema>;

function chunkKey(generation: string, index: number): string {
  return `${STORAGE_PREFIX}:${generation}:exercises:${index}`;
}

function chunkKeys(generation: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => chunkKey(generation, index));
}

function isCatalogChunkKey(key: string): boolean {
  return (
    key.startsWith(`${STORAGE_PREFIX}:`) &&
    key.includes(':exercises:') &&
    key !== MANIFEST_KEY
  );
}

function isStorageFullError(error: unknown): boolean {
  const values = Array.isArray(error) ? error : [error];
  return values.some((value) => {
    const message = String(value).toLowerCase();
    if (message.includes('sqlite_full') || message.includes('database or disk is full')) {
      return true;
    }
    if (typeof value !== 'object' || value === null || !('code' in value)) return false;
    return value.code === 13 || String(value.code).toLowerCase() === 'sqlite_full';
  });
}

function splitIntoChunks<T>(items: readonly T[]): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += CHUNK_SIZE) {
    chunks.push(items.slice(index, index + CHUNK_SIZE));
  }
  return chunks.length ? chunks : [[]];
}

export interface ExerciseCatalogLocalDataSource {
  load(): Promise<ExerciseCatalogSnapshot | null>;
  save(snapshot: ExerciseCatalogSnapshot): Promise<void>;
}

export class AsyncStorageExerciseCatalogDataSource implements ExerciseCatalogLocalDataSource {
  async load(): Promise<ExerciseCatalogSnapshot | null> {
    const serializedManifest = await AsyncStorage.getItem(MANIFEST_KEY);
    if (!serializedManifest) return null;

    try {
      const manifest = manifestSchema.parse(JSON.parse(serializedManifest));
      const serializedChunks = await AsyncStorage.multiGet(
        Array.from({ length: manifest.chunkCount }, (_, index) =>
          chunkKey(manifest.generation, index),
        ),
      );
      const exercises = serializedChunks.flatMap(([, serialized]) => {
        if (!serialized) throw new Error('Missing exercise catalog chunk');
        return z.array(storedExerciseSchema).parse(JSON.parse(serialized));
      });
      if (exercises.length !== manifest.exerciseCount) {
        throw new Error('Exercise catalog count mismatch');
      }
      return {
        exercises,
        taxonomies: manifest.taxonomies as ExerciseTaxonomies,
        syncedAt: manifest.syncedAt,
      };
    } catch {
      return null;
    }
  }

  async save(snapshot: ExerciseCatalogSnapshot): Promise<void> {
    const previousSerialized = await AsyncStorage.getItem(MANIFEST_KEY);
    let previous: ReturnType<typeof manifestSchema.safeParse> | null = null;
    if (previousSerialized) {
      try {
        previous = manifestSchema.safeParse(JSON.parse(previousSerialized));
      } catch {
        previous = null;
      }
    }

    const previousManifest = previous?.success ? previous.data : null;
    const allKeys = await AsyncStorage.getAllKeys();
    const staleChunkKeys = allKeys.filter(
      (key) =>
        isCatalogChunkKey(key) &&
        (!previousManifest ||
          !key.startsWith(`${STORAGE_PREFIX}:${previousManifest.generation}:exercises:`)),
    );
    if (staleChunkKeys.length) {
      await AsyncStorage.multiRemove(staleChunkKeys);
    }

    const generation = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const chunks = splitIntoChunks(snapshot.exercises);
    const serializedChunks = chunks.map(
      (chunk, index) => [chunkKey(generation, index), JSON.stringify(chunk)] as const,
    );
    let previousChunksRemoved = false;

    try {
      await AsyncStorage.multiSet(serializedChunks);
    } catch (error) {
      if (!previousManifest || !isStorageFullError(error)) throw error;

      await AsyncStorage.multiRemove(serializedChunks.map(([key]) => key));
      await AsyncStorage.multiRemove(
        chunkKeys(previousManifest.generation, previousManifest.chunkCount),
      );
      previousChunksRemoved = true;
      await AsyncStorage.multiSet(serializedChunks);
    }

    const manifest: Manifest = {
      schemaVersion: 1,
      generation,
      chunkCount: chunks.length,
      exerciseCount: snapshot.exercises.length,
      syncedAt: snapshot.syncedAt,
      taxonomies: Object.fromEntries(
        exerciseTaxonomyNames.map((name) => [
          name,
          snapshot.taxonomies[name].map(({ id, name: itemName, active, order }) => ({
            id,
            name: itemName,
            active,
            order,
          })),
        ]),
      ) as Manifest['taxonomies'],
    };
    const serializedManifest = JSON.stringify(manifest);
    try {
      await AsyncStorage.setItem(MANIFEST_KEY, serializedManifest);
    } catch (error) {
      if (!previousManifest || previousChunksRemoved || !isStorageFullError(error)) {
        throw error;
      }

      await AsyncStorage.multiRemove(
        chunkKeys(previousManifest.generation, previousManifest.chunkCount),
      );
      previousChunksRemoved = true;
      await AsyncStorage.setItem(MANIFEST_KEY, serializedManifest);
    }

    if (previousManifest && !previousChunksRemoved) {
      try {
        await AsyncStorage.multiRemove(
          chunkKeys(previousManifest.generation, previousManifest.chunkCount),
        );
      } catch {
        // The new manifest is already committed; stale chunks can be cleaned later.
      }
    }
  }
}
