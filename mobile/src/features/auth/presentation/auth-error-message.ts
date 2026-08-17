import { AuthFailure } from '../application/auth-failure';

const messageByCode = {
  'account-deletion-partial':
    'Seus dados foram removidos, mas a conta ainda não foi encerrada. Tente excluir novamente.',
  configuration:
    'O Firebase ainda não está configurado. Preencha o arquivo .env.local e reinicie o aplicativo.',
  'email-already-in-use': 'Este e-mail já está vinculado a uma conta.',
  'invalid-credentials': 'E-mail ou senha inválidos.',
  'invalid-email': 'Informe um e-mail válido.',
  network: 'Não foi possível conectar. Verifique sua internet e tente novamente.',
  'not-authenticated': 'Sua sessão terminou. Entre novamente para excluir a conta.',
  'too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'user-disabled': 'Esta conta foi desativada.',
  'weak-password': 'A senha não atende aos requisitos de segurança.',
  unknown: 'Não foi possível concluir a operação. Tente novamente.',
} as const;

export function getAuthErrorMessage(error: unknown): string {
  return error instanceof AuthFailure ? messageByCode[error.code] : messageByCode.unknown;
}
