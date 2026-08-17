import { WorkoutSessionFailure } from '../application/workout-session-failure';
import { WorkoutSessionValidationError } from '../domain/workout-session-rules';

export function getWorkoutSessionErrorMessage(error: unknown): string {
  if (error instanceof WorkoutSessionValidationError) {
    const set = error.setNumber ? `, série ${error.setNumber}` : '';
    const location = error.exerciseName ? ` em ${error.exerciseName}${set}` : '';
    const messages = {
      date: 'Informe uma data válida no formato AAAA-MM-DD.',
      division: 'Selecione uma divisão.',
      'empty-plan': 'Essa divisão não possui exercícios configurados.',
      load: `Informe uma carga entre 0 e 2000 kg${location}.`,
      repetitions: `Informe repetições inteiras entre 0 e 1000${location}.`,
      rpe: `Informe um RPE inteiro entre 1 e 10${location}.`,
      note: `A observação deve ter até 500 caracteres${location}.`,
      'empty-session': 'Preencha pelo menos uma série com repetições para concluir.',
    } as const;
    return messages[error.code];
  }

  if (error instanceof WorkoutSessionFailure) {
    const messages = {
      configuration: 'O Firebase ainda não está configurado neste aplicativo.',
      'invalid-data': 'O histórico contém um registro incompatível com o aplicativo.',
      'permission-denied': 'Sua sessão não permite concluir este treino.',
      network: 'Não foi possível salvar. O rascunho continua neste aparelho.',
      'too-many-sets': 'O treino excede o limite de séries por conclusão.',
      unknown: 'Não foi possível concluir. O rascunho continua neste aparelho.',
    } as const;
    return messages[error.code];
  }

  return 'Não foi possível concluir. O rascunho continua neste aparelho.';
}
