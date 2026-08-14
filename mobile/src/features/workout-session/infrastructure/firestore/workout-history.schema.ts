import { z } from 'zod';

import { firestoreMetadataShape } from '../../../../shared/infrastructure/firestore/firestore-metadata.schema';
import { isCivilDate } from '../../../../shared/validation/civil-date';

export const workoutHistoryDocumentSchema = z
  .object({
    Data: z.string().refine(isCivilDate, 'Expected a real date in YYYY-MM-DD'),
    Treino: z.string().trim().min(1).max(80),
    Exercício: z.string().trim().min(1).max(120),
    Série: z.number().int().min(1).max(100),
    Carga: z.number().min(0).max(2000),
    Reps: z.number().int().min(1).max(1000),
    RPE: z.number().int().min(1).max(10),
    Obs: z.string().max(500),
    sessionId: z.string().min(1).max(128).optional(),
    ...firestoreMetadataShape,
  })
  .strict();

export type WorkoutHistoryDocument = z.infer<typeof workoutHistoryDocumentSchema>;
