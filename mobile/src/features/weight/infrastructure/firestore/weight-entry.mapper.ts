import type { WeightEntry } from '../../domain/weight-entry';
import { parseFirestoreDocument } from '../../../../shared/infrastructure/firestore/invalid-firestore-document.error';
import { weightEntryDocumentSchema } from './weight-entry.schema';

export function mapWeightEntryDocument(
  documentId: string,
  data: unknown,
): WeightEntry {
  const document = parseFirestoreDocument(
    weightEntryDocumentSchema,
    'historico_pesos',
    documentId,
    data,
  );

  return {
    id: documentId,
    recordedOn: document.Data,
    weightKg: document.Peso,
    sourceSchemaVersion: document.schemaVersion ?? 0,
    ...(document.createdAt ? { createdAt: document.createdAt.toDate() } : {}),
    ...(document.updatedAt ? { updatedAt: document.updatedAt.toDate() } : {}),
  };
}
