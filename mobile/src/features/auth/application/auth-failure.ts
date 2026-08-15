export type AuthFailureCode =
  | 'configuration'
  | 'email-already-in-use'
  | 'invalid-credentials'
  | 'invalid-email'
  | 'network'
  | 'too-many-requests'
  | 'user-disabled'
  | 'weak-password'
  | 'unknown';

export class AuthFailure extends Error {
  constructor(
    readonly code: AuthFailureCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'AuthFailure';
  }
}
