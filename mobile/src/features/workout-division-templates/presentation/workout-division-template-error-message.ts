import { WorkoutDivisionTemplateFailure } from '../application/workout-division-template-failure';
import { WorkoutDivisionRuleError } from '@/features/workout-divisions/domain/workout-division';

export function getWorkoutDivisionTemplateErrorMessage(error: unknown): string {
  if (error instanceof WorkoutDivisionRuleError) {
    if (error.code === 'name-required') return 'Informe o nome da divisão.';
    if (error.code === 'name-too-long') return 'Use no máximo 80 caracteres.';
  }
  if (error instanceof WorkoutDivisionTemplateFailure) {
    return {
      configuration: 'O Firebase ainda não foi configurado.',
      duplicate: 'Já existe uma divisão com esse nome. Escolha outro nome.',
      'invalid-data': 'Esta divisão pronta possui dados inválidos.',
      network: 'Não foi possível acessar as divisões. Verifique sua conexão.',
      'not-found': 'Esta divisão não está mais disponível.',
      'permission-denied': 'Sua sessão não permite acessar esta divisão.',
      unavailable: 'A divisão mudou. Atualize os detalhes e tente novamente.',
      unknown: 'Não foi possível adicionar a divisão.',
    }[error.code];
  }
  return 'Não foi possível adicionar a divisão.';
}
