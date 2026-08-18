import { z } from 'zod';

import { firestoreMetadataShape } from '../../../../shared/infrastructure/firestore/firestore-metadata.schema';
import { isCivilDate } from '../../../../shared/validation/civil-date';

export const weightEntryDocumentSchema = z
  .object({
    Data: z.string().refine(isCivilDate, 'Expected a real date in YYYY-MM-DD'),
    Peso: z.number().min(30).max(500),
    ...firestoreMetadataShape,
  })
  .strict();

export type WeightEntryDocument = z.infer<typeof weightEntryDocumentSchema>;
