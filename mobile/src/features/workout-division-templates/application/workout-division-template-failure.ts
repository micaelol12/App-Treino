export type WorkoutDivisionTemplateFailureCode =
  | 'configuration'
  | 'duplicate'
  | 'invalid-data'
  | 'network'
  | 'not-found'
  | 'permission-denied'
  | 'unavailable'
  | 'unknown';

export class WorkoutDivisionTemplateFailure extends Error {
  constructor(
    readonly code: WorkoutDivisionTemplateFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'WorkoutDivisionTemplateFailure';
  }
}
