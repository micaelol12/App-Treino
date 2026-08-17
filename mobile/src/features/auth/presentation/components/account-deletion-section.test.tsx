import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { AuthFailure } from '../../application/auth-failure';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { AccountDeletionSection } from './account-deletion-section';

async function arrange(
  deleteAccount = jest.fn<Promise<void>, [string]>(() => Promise.resolve()),
) {
  await render(
    <AppThemeProvider>
      <AccountDeletionSection deleteAccount={deleteAccount} />
    </AppThemeProvider>,
  );
  return deleteAccount;
}

describe('AccountDeletionSection', () => {
  afterEach(() => jest.restoreAllMocks());

  it('exige senha e confirmação destrutiva antes de excluir', async () => {
    const deleteAccount = await arrange();
    await fireEvent.press(screen.getByTestId('account-deletion-button'));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Informe sua senha atual para confirmar a exclusão.',
    );
    expect(deleteAccount).not.toHaveBeenCalled();

    const alert = jest.spyOn(Alert, 'alert');
    await fireEvent.changeText(
      screen.getByTestId('account-deletion-password'),
      'Treino123',
    );
    await fireEvent.press(screen.getByTestId('account-deletion-button'));

    expect(alert).toHaveBeenCalledWith(
      'Excluir conta e dados?',
      expect.stringContaining('não pode ser desfeita'),
      expect.any(Array),
    );
    const actions = alert.mock.calls[0]?.[2];
    await act(async () => actions?.[1]?.onPress?.());
    expect(deleteAccount).toHaveBeenCalledWith('Treino123');
  });

  it('mostra falha segura e permite tentar novamente', async () => {
    const deleteAccount = await arrange(
      jest.fn().mockRejectedValue(new AuthFailure('network')),
    );
    const alert = jest.spyOn(Alert, 'alert');
    await fireEvent.changeText(
      screen.getByTestId('account-deletion-password'),
      'Treino123',
    );
    await fireEvent.press(screen.getByTestId('account-deletion-button'));
    const actions = alert.mock.calls[0]?.[2];
    await act(async () => actions?.[1]?.onPress?.());

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível conectar. Verifique sua internet e tente novamente.',
    );
    expect(screen.getByTestId('account-deletion-button')).toBeEnabled();
  });
});
