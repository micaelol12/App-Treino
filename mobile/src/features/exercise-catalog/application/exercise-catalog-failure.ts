export type ExerciseCatalogFailureCode =
  'permission-denied' | 'network' | 'invalid-data' | 'configuration' | 'unknown';

export class ExerciseCatalogFailure extends Error {
  constructor(
    readonly code: ExerciseCatalogFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'ExerciseCatalogFailure';
  }
}
