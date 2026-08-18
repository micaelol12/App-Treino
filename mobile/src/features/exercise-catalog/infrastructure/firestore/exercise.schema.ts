import { z } from 'zod';

export const exerciseDocumentSchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    name: z.string().trim().min(1).max(160),
    force: z.string().trim().min(1).nullable(),
    level: z.string().trim().min(1),
    mechanic: z.string().trim().min(1).nullable(),
    equipment: z.string().trim().min(1).nullable(),
    primaryMuscles: z.array(z.string().trim().min(1)),
    secondaryMuscles: z.array(z.string().trim().min(1)),
    instructions: z.array(z.string().trim().min(1)),
    category: z.string().trim().min(1),
    images: z.array(z.string().trim().min(1)),
  })
  .strict();

export type ExerciseDocument = z.infer<typeof exerciseDocumentSchema>;
