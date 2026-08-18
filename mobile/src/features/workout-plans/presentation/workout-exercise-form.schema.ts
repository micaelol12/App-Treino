import { z } from 'zod';

const integerField = (label: string, minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${label}.`)
    .regex(/^\d+$/, `${label} deve ser um número inteiro.`)
    .refine((value) => Number(value) >= minimum && Number(value) <= maximum, {
      message: `${label} deve estar entre ${minimum} e ${maximum}.`,
    });

export const workoutExerciseFormSchema = z.object({
  divisionId: z.string().trim().min(1, 'Selecione a divisão.'),
  exerciseDocumentId: z.string().trim().min(1, 'Selecione o exercício.'),
  defaultSets: integerField('Séries', 1, 10),
  order: integerField('Ordem', 1, 999),
});

export type WorkoutExerciseFormValues = z.infer<typeof workoutExerciseFormSchema>;
