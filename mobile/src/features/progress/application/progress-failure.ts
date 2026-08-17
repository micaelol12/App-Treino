export type ProgressFailureCode =
  'configuration' | 'invalid-data' | 'network' | 'permission-denied' | 'unknown';

export class ProgressFailure extends Error {
  constructor(
    readonly code: ProgressFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'ProgressFailure';
  }
}
