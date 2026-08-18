import { z } from 'zod';

export interface FirestoreTimestampLike {
  toDate(): Date;
}

export const firestoreTimestampSchema = z.custom<FirestoreTimestampLike>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function' &&
    value.toDate() instanceof Date,
  { message: 'Expected a Firestore Timestamp' },
);

export const firestoreMetadataShape = {
  schemaVersion: z.literal(1).optional(),
  createdAt: firestoreTimestampSchema.optional(),
  updatedAt: firestoreTimestampSchema.optional(),
};
