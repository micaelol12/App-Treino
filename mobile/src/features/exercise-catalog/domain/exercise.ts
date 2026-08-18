export interface Exercise {
  readonly documentId: string;
  readonly id: string;
  readonly name: string;
  readonly force: string | null;
  readonly level: string;
  readonly mechanic: string | null;
  readonly equipment: string | null;
  readonly primaryMuscles: readonly string[];
  readonly secondaryMuscles: readonly string[];
  readonly instructions: readonly string[];
  readonly category: string;
  readonly images: readonly string[];
  readonly videoUrl?: string | null | undefined;
  readonly active?: boolean | undefined;
}

export function sortExercises(exercises: readonly Exercise[]): Exercise[] {
  return [...exercises].sort(
    (left, right) =>
      left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }) ||
      left.id.localeCompare(right.id),
  );
}
