import { z } from 'zod';

import { firestoreTimestampSchema } from '@/shared/infrastructure/firestore/firestore-metadata.schema';

export const workoutDivisionTemplateDocumentSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().max(500),
    level: z.string().max(80),
    goal: z.string().max(80),
    status: z.literal('published'),
    displayOrder: z.number().int().min(0).max(9999),
    exerciseCount: z.number().int().min(1).max(15),
    version: z.number().int().min(1).max(9999),
    schemaVersion: z.literal(1),
    createdAt: firestoreTimestampSchema,
    updatedAt: firestoreTimestampSchema,
    publishedAt: firestoreTimestampSchema,
  })
  .strict();

export const workoutDivisionTemplateExerciseDocumentSchema = z
  .object({
    exerciseId: z.string().trim().min(1).max(160),
    exerciseDocumentId: z.string().trim().min(1).max(128),
    exerciseNameSnapshot: z.string().trim().min(1).max(160),
    defaultSets: z.number().int().min(1).max(10),
    order: z.number().int().min(1).max(15),
    schemaVersion: z.literal(1),
    createdAt: firestoreTimestampSchema,
    updatedAt: firestoreTimestampSchema,
  })
  .strict();
