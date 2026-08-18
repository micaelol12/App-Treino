import { z } from 'zod';

import { firestoreTimestampSchema } from '@/shared/infrastructure/firestore/firestore-metadata.schema';

export const workoutPlanItemDocumentSchema = z
  .object({
    exerciseId: z.string().trim().min(1).max(160),
    exerciseDocumentId: z.string().trim().min(1).max(160),
    exerciseNameSnapshot: z.string().trim().min(1).max(160),
    defaultSets: z.number().int().min(1).max(10),
    order: z.number().int().min(1).max(999),
    active: z.boolean(),
    schemaVersion: z.literal(2),
    createdAt: firestoreTimestampSchema.optional(),
    updatedAt: firestoreTimestampSchema.optional(),
  })
  .strict();
