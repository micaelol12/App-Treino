import { z } from 'zod';

import { firestoreTimestampSchema } from '@/shared/infrastructure/firestore/firestore-metadata.schema';

export const workoutDivisionDocumentSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    order: z.number().int().min(1).max(999),
    active: z.boolean(),
    schemaVersion: z.literal(2),
    createdAt: firestoreTimestampSchema.optional(),
    updatedAt: firestoreTimestampSchema.optional(),
  })
  .strict();
