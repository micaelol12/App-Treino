export type WeightFailureCode =
  'configuration' | 'invalid-data' | 'network' | 'permission-denied' | 'unknown';

export class WeightFailure extends Error {
  constructor(
    readonly code: WeightFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'WeightFailure';
  }
}
