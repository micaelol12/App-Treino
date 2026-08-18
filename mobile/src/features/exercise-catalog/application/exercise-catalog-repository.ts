import type { Exercise } from '../domain/exercise';

export const exerciseTaxonomyNames = [
  'equipamentos',
  'categorias',
  'forcas',
  'niveis',
  'mecanicas',
  'musculos',
] as const;

export type ExerciseTaxonomyName = (typeof exerciseTaxonomyNames)[number];

export interface ExerciseTaxonomyItem {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly order: number;
}

export type ExerciseTaxonomies = Readonly<
  Record<ExerciseTaxonomyName, readonly ExerciseTaxonomyItem[]>
>;

export interface ExerciseCatalogSnapshot {
  readonly exercises: readonly Exercise[];
  readonly taxonomies: ExerciseTaxonomies;
  readonly syncedAt: string;
}

export interface ExerciseCatalogRepository {
  getLocal(): Promise<ExerciseCatalogSnapshot | null>;
  ensureAvailable(): Promise<ExerciseCatalogSnapshot>;
  synchronize(): Promise<ExerciseCatalogSnapshot>;
}
