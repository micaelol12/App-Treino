export type WorkoutPlanFailureCode =
  | 'duplicate'
  | 'duplicate-order'
  | 'not-found'
  | 'permission-denied'
  | 'network'
  | 'invalid-data'
  | 'configuration'
  | 'unknown';

export class WorkoutPlanFailure extends Error {
  constructor(
    readonly code: WorkoutPlanFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'WorkoutPlanFailure';
  }
}
