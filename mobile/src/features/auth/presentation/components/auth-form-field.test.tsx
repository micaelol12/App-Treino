import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { AuthFormField } from './auth-form-field';

describe('AuthFormField', () => {
  it('toggles password visibility without changing its value', async () => {
    await render(
      <AppThemeProvider>
        <AuthFormField
          label="Senha"
          secureTextEntry
          testID="password"
          value="Segredo123"
        />
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('password')).toHaveProp('secureTextEntry', true);
    await fireEvent.press(screen.getByTestId('password-visibility'));
    expect(screen.getByTestId('password')).toHaveProp('secureTextEntry', false);
    expect(screen.getByDisplayValue('Segredo123')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Ocultar senha'));
    expect(screen.getByTestId('password')).toHaveProp('secureTextEntry', true);
  });
});
