import { WorkoutPlanFailure } from '../application/workout-plan-failure';
import { WorkoutPlanRuleError } from '../domain/workout-plan-rules';

export function getWorkoutPlanErrorMessage(error: unknown): string {
  if (error instanceof WorkoutPlanRuleError) {
    const messages: Record<WorkoutPlanRuleError['code'], string> = {
      'division-required': 'Selecione uma divisão cadastrada.',
      'exercise-required': 'Selecione um exercício do catálogo.',
      'invalid-default-sets': 'As séries devem ser um número inteiro entre 1 e 10.',
      'invalid-order': 'A ordem deve ser um número inteiro entre 1 e 999.',
    };
    return messages[error.code];
  }

  if (error instanceof WorkoutPlanFailure) {
    const messages: Record<WorkoutPlanFailure['code'], string> = {
      duplicate: 'Este exercício já existe na divisão informada.',
      'duplicate-order': 'Esta ordem já está em uso na divisão informada.',
      'not-found': 'O exercício não existe mais. Atualize a lista e tente novamente.',
      'permission-denied': 'Sua sessão não permite alterar este plano.',
      network: 'Não foi possível acessar o plano. Verifique sua conexão.',
      'invalid-data': 'O plano contém um documento incompatível com o aplicativo.',
      configuration: 'O Firestore ainda não foi configurado neste ambiente.',
      unknown: 'Não foi possível concluir a operação. Tente novamente.',
    };
    return messages[error.code];
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}
