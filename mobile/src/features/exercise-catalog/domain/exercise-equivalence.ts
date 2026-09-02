import type { Exercise } from './exercise';

const PRIMARY_MUSCLE_WEIGHT = 3;
const SECONDARY_MUSCLE_WEIGHT = 1;
const DEFAULT_RESULT_LIMIT = 10;

export interface ExerciseIdentity {
  readonly exerciseDocumentId?: string | undefined;
  readonly exerciseId?: string | undefined;
  readonly exerciseName: string;
}

export interface EquivalentExercise {
  readonly exercise: Exercise;
  readonly similarity: number;
  readonly sharedPrimaryMuscles: readonly string[];
  readonly sharedOtherMuscles: readonly string[];
}

export interface EquivalentExerciseOptions {
  readonly excludedDocumentIds?: ReadonlySet<string> | undefined;
  readonly excludedExerciseIds?: ReadonlySet<string> | undefined;
  readonly limit?: number | undefined;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function createMuscleWeightMap(exercise: Exercise): ReadonlyMap<string, number> {
  const weights = new Map<string, number>();
  for (const muscle of unique(exercise.secondaryMuscles)) {
    weights.set(muscle, SECONDARY_MUSCLE_WEIGHT);
  }
  for (const muscle of unique(exercise.primaryMuscles)) {
    weights.set(muscle, PRIMARY_MUSCLE_WEIGHT);
  }
  return weights;
}

export function calculateExerciseSimilarity(
  source: Exercise,
  candidate: Exercise,
): number {
  const sourceWeights = createMuscleWeightMap(source);
  const candidateWeights = createMuscleWeightMap(candidate);
  const muscles = new Set([...sourceWeights.keys(), ...candidateWeights.keys()]);
  let intersection = 0;
  let union = 0;

  for (const muscle of muscles) {
    const sourceWeight = sourceWeights.get(muscle) ?? 0;
    const candidateWeight = candidateWeights.get(muscle) ?? 0;
    intersection += Math.min(sourceWeight, candidateWeight);
    union += Math.max(sourceWeight, candidateWeight);
  }

  return union === 0 ? 0 : intersection / union;
}

export function findCatalogExercise(
  exercises: readonly Exercise[],
  identity: ExerciseIdentity,
): Exercise | undefined {
  if (identity.exerciseDocumentId) {
    const byDocumentId = exercises.find(
      (exercise) => exercise.documentId === identity.exerciseDocumentId,
    );
    if (byDocumentId) return byDocumentId;
  }

  if (identity.exerciseId) {
    const byExerciseId = exercises.find(
      (exercise) => exercise.id === identity.exerciseId,
    );
    if (byExerciseId) return byExerciseId;
  }

  return exercises.find((exercise) => exercise.name === identity.exerciseName);
}

export function rankEquivalentExercises(
  source: Exercise,
  candidates: readonly Exercise[],
  options: EquivalentExerciseOptions = {},
): EquivalentExercise[] {
  const sourcePrimaryMuscles = new Set(source.primaryMuscles);
  const sourceMuscles = new Set([...source.primaryMuscles, ...source.secondaryMuscles]);
  const limit = Math.max(0, Math.floor(options.limit ?? DEFAULT_RESULT_LIMIT));

  return candidates
    .filter(
      (candidate) =>
        candidate.active !== false &&
        candidate.documentId !== source.documentId &&
        candidate.id !== source.id &&
        !options.excludedDocumentIds?.has(candidate.documentId) &&
        !options.excludedExerciseIds?.has(candidate.id) &&
        candidate.primaryMuscles.some((muscle) => sourcePrimaryMuscles.has(muscle)),
    )
    .map((candidate): EquivalentExercise => {
      const candidatePrimaryMuscles = new Set(candidate.primaryMuscles);
      const sharedPrimaryMuscles = unique(source.primaryMuscles).filter((muscle) =>
        candidatePrimaryMuscles.has(muscle),
      );
      const sharedOtherMuscles = unique([
        ...candidate.primaryMuscles,
        ...candidate.secondaryMuscles,
      ]).filter(
        (muscle) => sourceMuscles.has(muscle) && !sharedPrimaryMuscles.includes(muscle),
      );

      return {
        exercise: candidate,
        similarity: calculateExerciseSimilarity(source, candidate),
        sharedPrimaryMuscles,
        sharedOtherMuscles,
      };
    })
    .sort(
      (left, right) =>
        right.similarity - left.similarity ||
        right.sharedPrimaryMuscles.length - left.sharedPrimaryMuscles.length ||
        right.sharedOtherMuscles.length - left.sharedOtherMuscles.length ||
        left.exercise.name.localeCompare(right.exercise.name, 'pt-BR', {
          sensitivity: 'base',
        }) ||
        left.exercise.documentId.localeCompare(right.exercise.documentId),
    )
    .slice(0, limit);
}
