import { z } from 'zod';

import { firestoreMetadataShape } from '../../../../shared/infrastructure/firestore/firestore-metadata.schema';

export const workoutConfigDocumentSchema = z
  .object({
    Divisao: z.string().trim().min(1).max(80),
    Exercicio: z.string().trim().min(1).max(120),
    Series_Padrao: z.number().int().min(1).max(10),
    Ordem: z.number().int().min(1).max(999).optional(),
    ...firestoreMetadataShape,
  })
  .strict();

export type WorkoutConfigDocument = z.infer<typeof workoutConfigDocumentSchema>;
