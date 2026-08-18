export type WorkoutDivisionFailureCode =
  | 'duplicate'
  | 'duplicate-order'
  | 'not-found'
  | 'permission-denied'
  | 'network'
  | 'invalid-data'
  | 'configuration'
  | 'unknown';

export class WorkoutDivisionFailure extends Error {
  constructor(
    readonly code: WorkoutDivisionFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'WorkoutDivisionFailure';
  }
}
