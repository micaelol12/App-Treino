import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { type ReactNode } from 'react';

import {
  type AuthCredentials,
  type AuthGateway,
  type AuthStateListener,
} from '../../application/auth-gateway';
import { AuthProvider } from '../auth-context';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { PasswordResetScreen } from './password-reset-screen';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

class PasswordResetGateway implements AuthGateway {
  readonly sendPasswordReset = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

  subscribe(listener: AuthStateListener) {
    listener(null);
    return jest.fn();
  }

  signIn(_credentials: AuthCredentials) {
    return Promise.resolve();
  }

  signUp(_credentials: AuthCredentials) {
    return Promise.resolve();
  }

  signOut() {
    return Promise.resolve();
  }
}

describe('PasswordResetScreen', () => {
  it('sends a reset request and displays a neutral confirmation', async () => {
    const gateway = new PasswordResetGateway();
    await render(
      <AppThemeProvider>
        <AuthProvider gatewayFactory={() => gateway}>
          <PasswordResetScreen />
        </AuthProvider>
      </AppThemeProvider>,
    );

    await fireEvent.changeText(
      screen.getByTestId('auth-email-input'),
      'user@example.com',
    );
    await fireEvent.press(screen.getByTestId('auth-reset-button'));

    await waitFor(() => {
      expect(gateway.sendPasswordReset).toHaveBeenCalledWith('user@example.com');
      expect(
        screen.getByText(
          'Se houver uma conta para este e-mail, enviaremos as instruções de redefinição.',
        ),
      ).toBeOnTheScreen();
    });
  });
});
