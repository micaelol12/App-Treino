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
    sourceTemplateId: z.string().trim().min(1).max(128).optional(),
    sourceTemplateVersion: z.number().int().min(1).optional(),
    importedAt: firestoreTimestampSchema.optional(),
  })
  .refine(
    (document) =>
      [
        document.sourceTemplateId,
        document.sourceTemplateVersion,
        document.importedAt,
      ].every((value) => value === undefined) ||
      [
        document.sourceTemplateId,
        document.sourceTemplateVersion,
        document.importedAt,
      ].every((value) => value !== undefined),
    'Os metadados do modelo devem ser informados em conjunto.',
  )
  .strict();
