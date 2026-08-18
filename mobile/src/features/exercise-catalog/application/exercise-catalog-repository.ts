import type { Exercise } from '../domain/exercise';

export interface ExerciseCatalogRepository {
  list(): Promise<readonly Exercise[]>;
}
