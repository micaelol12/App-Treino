import { AuthFailure } from '../../application/auth-failure';

import { mapFirebaseAuthError } from './firebase-auth-error';

describe('mapFirebaseAuthError', () => {
  it('maps credential errors without revealing whether an account exists', () => {
    const result = mapFirebaseAuthError(
      Object.assign(new Error('Internal Firebase detail'), {
        code: 'auth/user-not-found',
      }),
    );

    expect(result).toBeInstanceOf(AuthFailure);
    expect(result.code).toBe('invalid-credentials');
    expect(result.message).toBe('invalid-credentials');
  });

  it('maps known operational errors', () => {
    expect(
      mapFirebaseAuthError(
        Object.assign(new Error('offline'), { code: 'auth/network-request-failed' }),
      ).code,
    ).toBe('network');
  });

  it('preserves an application failure', () => {
    const failure = new AuthFailure('configuration');

    expect(mapFirebaseAuthError(failure)).toBe(failure);
  });

  it('maps unknown values to an opaque failure', () => {
    expect(mapFirebaseAuthError('unexpected').code).toBe('unknown');
  });
});
