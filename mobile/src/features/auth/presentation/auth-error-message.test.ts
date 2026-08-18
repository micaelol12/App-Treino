import { AuthFailure } from '../application/auth-failure';

import { getAuthErrorMessage } from './auth-error-message';

describe('getAuthErrorMessage', () => {
  it.each([
    ['invalid-credentials', 'E-mail ou senha inválidos.'],
    ['network', 'Não foi possível conectar. Verifique sua internet e tente novamente.'],
    [
      'configuration',
      'O Firebase ainda não está configurado. Preencha o arquivo .env.local e reinicie o aplicativo.',
    ],
  ] as const)('maps %s to a safe message', (code, expectedMessage) => {
    expect(getAuthErrorMessage(new AuthFailure(code))).toBe(expectedMessage);
  });

  it('does not expose unexpected internal errors', () => {
    expect(getAuthErrorMessage(new Error('secret backend detail'))).toBe(
      'Não foi possível concluir a operação. Tente novamente.',
    );
  });
});
