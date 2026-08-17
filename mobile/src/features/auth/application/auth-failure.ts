export type AuthFailureCode =
  | 'account-deletion-partial'
  | 'configuration'
  | 'email-already-in-use'
  | 'invalid-credentials'
  | 'invalid-email'
  | 'network'
  | 'not-authenticated'
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
