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
  .strict();

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
    const generation = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const chunks = splitIntoChunks(snapshot.exercises);
    await AsyncStorage.multiSet(
      chunks.map((chunk, index) => [chunkKey(generation, index), JSON.stringify(chunk)]),
    );

    const manifest: Manifest = {
      schemaVersion: 1,
      generation,
      chunkCount: chunks.length,
      exerciseCount: snapshot.exercises.length,
      syncedAt: snapshot.syncedAt,
      taxonomies: Object.fromEntries(
        exerciseTaxonomyNames.map((name) => [
          name,
          snapshot.taxonomies[name].map((item) => ({ ...item })),
        ]),
      ) as Manifest['taxonomies'],
    };
    await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));

    if (previous?.success) {
      try {
        await AsyncStorage.multiRemove(
          Array.from({ length: previous.data.chunkCount }, (_, index) =>
            chunkKey(previous.data.generation, index),
          ),
        );
      } catch {
        // The new manifest is already committed; stale chunks can be cleaned later.
      }
    }
  }
}
