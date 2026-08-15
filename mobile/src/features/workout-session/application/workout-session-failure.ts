export type WorkoutSessionFailureCode =
  'configuration' | 'permission-denied' | 'network' | 'too-many-sets' | 'unknown';

export class WorkoutSessionFailure extends Error {
  constructor(
    readonly code: WorkoutSessionFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'WorkoutSessionFailure';
  }
}
