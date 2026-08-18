import type {
  ExerciseCatalogRepository,
  ExerciseCatalogSnapshot,
} from '../application/exercise-catalog-repository';
import type { ExerciseCatalogLocalDataSource } from './local/async-storage-exercise-catalog';

export interface ExerciseCatalogRemoteDataSource {
  download(): Promise<ExerciseCatalogSnapshot>;
}

export class CachedExerciseCatalogRepository implements ExerciseCatalogRepository {
  private synchronization: Promise<ExerciseCatalogSnapshot> | null = null;

  constructor(
    private readonly local: ExerciseCatalogLocalDataSource,
    private readonly remote: ExerciseCatalogRemoteDataSource,
  ) {}

  getLocal(): Promise<ExerciseCatalogSnapshot | null> {
    return this.local.load();
  }

  async ensureAvailable(): Promise<ExerciseCatalogSnapshot> {
    const local = await this.local.load();
    return local ?? this.synchronize();
  }

  synchronize(): Promise<ExerciseCatalogSnapshot> {
    if (this.synchronization) return this.synchronization;
    this.synchronization = this.remote
      .download()
      .then(async (snapshot) => {
        await this.local.save(snapshot);
        return snapshot;
      })
      .finally(() => {
        this.synchronization = null;
      });
    return this.synchronization;
  }
}
