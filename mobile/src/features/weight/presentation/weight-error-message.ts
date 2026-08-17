import { WeightFailure } from '../application/weight-failure';
import { WeightRuleError } from '../domain/weight-rules';

export function getWeightErrorMessage(error: unknown): string {
  if (error instanceof WeightRuleError) {
    return error.code === 'date'
      ? 'Informe uma data real no formato AAAA-MM-DD.'
      : 'Informe um peso entre 30 e 500 kg.';
  }
  if (error instanceof WeightFailure) {
    const messages: Record<WeightFailure['code'], string> = {
      configuration: 'O Firestore ainda não foi configurado neste ambiente.',
      'invalid-data': 'O histórico contém uma pesagem incompatível com o aplicativo.',
      network: 'Não foi possível acessar as pesagens. Verifique sua conexão.',
      'permission-denied': 'Sua sessão não permite acessar estas pesagens.',
      unknown: 'Não foi possível concluir a operação. Tente novamente.',
    };
    return messages[error.code];
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}
