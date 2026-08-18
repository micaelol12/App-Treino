import { ProgressFailure } from '../application/progress-failure';

export function getProgressErrorMessage(error: unknown): string {
  if (error instanceof ProgressFailure) {
    const messages: Record<ProgressFailure['code'], string> = {
      configuration: 'O Firestore ainda não foi configurado neste ambiente.',
      'invalid-data': 'O histórico contém um registro incompatível com o aplicativo.',
      network: 'Não foi possível acessar a evolução. Verifique sua conexão.',
      'permission-denied': 'Sua sessão não permite acessar este histórico.',
      unknown: 'Não foi possível carregar a evolução. Tente novamente.',
    };
    return messages[error.code];
  }
  return 'Não foi possível carregar a evolução. Tente novamente.';
}
