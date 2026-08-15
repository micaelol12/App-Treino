import { AuthFailure, type AuthFailureCode } from '../../application/auth-failure';

const failureByFirebaseCode: Readonly<Record<string, AuthFailureCode>> = {
  'auth/email-already-in-use': 'email-already-in-use',
  'auth/invalid-credential': 'invalid-credentials',
  'auth/invalid-email': 'invalid-email',
  'auth/network-request-failed': 'network',
  'auth/too-many-requests': 'too-many-requests',
  'auth/user-disabled': 'user-disabled',
  'auth/user-not-found': 'invalid-credentials',
  'auth/weak-password': 'weak-password',
  'auth/wrong-password': 'invalid-credentials',
};

export function mapFirebaseAuthError(error: unknown): AuthFailure {
  if (error instanceof AuthFailure) {
    return error;
  }

  const firebaseCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : undefined;
  const failureCode = firebaseCode ? failureByFirebaseCode[firebaseCode] : undefined;

  return new AuthFailure(failureCode ?? 'unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}
