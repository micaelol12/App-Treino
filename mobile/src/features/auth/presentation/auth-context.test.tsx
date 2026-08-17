import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import {
  type AuthCredentials,
  type AuthErrorListener,
  type AuthGateway,
  type AuthStateListener,
} from '../application/auth-gateway';
import { AuthFailure } from '../application/auth-failure';
import { type AuthSession } from '../domain/auth-session';

import { AuthProvider, useAuth } from './auth-context';

class FakeAuthGateway implements AuthGateway {
  private listener: AuthStateListener | null = null;
  private errorListener: AuthErrorListener | undefined;

  readonly signIn = jest.fn<Promise<void>, [AuthCredentials]>(() => Promise.resolve());
  readonly signUp = jest.fn<Promise<void>, [AuthCredentials]>(() => Promise.resolve());
  readonly sendPasswordReset = jest.fn<Promise<void>, [string]>(() => Promise.resolve());
  readonly signOut = jest.fn<Promise<void>, []>(() => Promise.resolve());
  readonly deleteAccount = jest.fn<Promise<void>, [string]>(() => Promise.resolve());
  readonly unsubscribe = jest.fn();

  subscribe(listener: AuthStateListener, onError?: AuthErrorListener) {
    this.listener = listener;
    this.errorListener = onError;
    return this.unsubscribe;
  }

  emitSession(session: AuthSession | null) {
    this.listener?.(session);
  }

  emitError(error: Error) {
    this.errorListener?.(error);
  }
}

function AuthProbe() {
  const { isLoading, session, signOut, startupError } = useAuth();

  return (
    <View>
      <Text testID="status">{isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="session">
        {session ? `${session.uid}:${session.email}` : 'anonymous'}
      </Text>
      <Text testID="error">{startupError?.message ?? 'none'}</Text>
      <TouchableOpacity onPress={signOut} testID="sign-out">
        <Text>sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

describe('AuthProvider', () => {
  it('restores only the session emitted by the trusted gateway', async () => {
    const gateway = new FakeAuthGateway();
    await render(
      <AuthProvider gatewayFactory={() => gateway}>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('loading');

    await act(async () => {
      gateway.emitSession({ uid: 'firebase-uid', email: 'user@example.com' });
    });

    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('session')).toHaveTextContent(
      'firebase-uid:user@example.com',
    );
  });

  it('removes local access when the gateway emits a null session', async () => {
    const gateway = new FakeAuthGateway();
    await render(
      <AuthProvider gatewayFactory={() => gateway}>
        <AuthProbe />
      </AuthProvider>,
    );

    await act(async () => {
      gateway.emitSession({ uid: 'firebase-uid', email: 'user@example.com' });
    });
    await act(async () => {
      gateway.emitSession(null);
    });

    expect(screen.getByTestId('session')).toHaveTextContent('anonymous');
  });

  it('delegates logout to the gateway', async () => {
    const gateway = new FakeAuthGateway();
    await render(
      <AuthProvider gatewayFactory={() => gateway}>
        <AuthProbe />
      </AuthProvider>,
    );

    await act(async () => fireEvent.press(screen.getByTestId('sign-out')));

    expect(gateway.signOut).toHaveBeenCalledTimes(1);
  });

  it('exposes a subscription error and finishes restoration', async () => {
    const gateway = new FakeAuthGateway();
    await render(
      <AuthProvider gatewayFactory={() => gateway}>
        <AuthProbe />
      </AuthProvider>,
    );

    await act(async () => {
      gateway.emitError(new AuthFailure('network'));
    });

    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('error')).toHaveTextContent('network');
  });

  it('fails closed when Firebase cannot be configured', async () => {
    await render(
      <AuthProvider
        gatewayFactory={() => {
          throw new AuthFailure('configuration');
        }}
      >
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('session')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('error')).toHaveTextContent('configuration');
  });
});
