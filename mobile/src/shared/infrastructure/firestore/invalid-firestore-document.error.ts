import { z } from 'zod';

import { reportError } from '@/shared/telemetry/error-reporter';

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
    const error = new InvalidFirestoreDocumentError({
      collection,
      documentId,
      issues: result.error.issues,
    });
    reportError('legacy_document_rejected', error, {
      collection,
      issueCodes: result.error.issues.map((issue) => issue.code),
      issuePaths: result.error.issues.flatMap((issue) =>
        issue.path.length ? [issue.path.join('.')] : [],
      ),
    });
    throw error;
  }

  return result.data;
}
