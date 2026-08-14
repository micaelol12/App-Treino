import { z } from 'zod';

interface InvalidFirestoreDocumentContext {
  readonly collection: string;
  readonly documentId: string;
  readonly issues: readonly z.core.$ZodIssue[];
}

export class InvalidFirestoreDocumentError extends Error {
  readonly collection: string;
  readonly documentId: string;
  readonly issues: readonly z.core.$ZodIssue[];

  constructor(context: InvalidFirestoreDocumentContext) {
    super(`Invalid document ${context.collection}/${context.documentId}`);
    this.name = 'InvalidFirestoreDocumentError';
    this.collection = context.collection;
    this.documentId = context.documentId;
    this.issues = context.issues;
  }
}

export function parseFirestoreDocument<T>(
  schema: z.ZodType<T>,
  collection: string,
  documentId: string,
  data: unknown,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new InvalidFirestoreDocumentError({
      collection,
      documentId,
      issues: result.error.issues,
    });
  }

  return result.data;
}
