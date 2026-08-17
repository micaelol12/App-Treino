import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  documentId,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';

import { WeightFailure } from '../../application/weight-failure';
import type {
  WeightPage,
  WeightPageCursor,
  WeightRepository,
} from '../../application/weight-repository';
import type { WeightEntryDraft } from '../../domain/weight-rules';
import { InvalidFirestoreDocumentError } from '@/shared/infrastructure/firestore/invalid-firestore-document.error';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';

import { mapWeightEntryDocument } from './weight-entry.mapper';

function initializeFirestore(): Firestore {
  try {
    return getFirebaseFirestore();
  } catch (error) {
    throw new WeightFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function collectionPath(userId: string): string {
  return `usuarios/${userId}/historico_pesos`;
}

function mapFirestoreFailure(error: unknown): WeightFailure {
  if (error instanceof WeightFailure) return error;
  if (error instanceof InvalidFirestoreDocumentError) {
    return new WeightFailure('invalid-data', { cause: error });
  }
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return new WeightFailure('permission-denied', { cause: error });
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return new WeightFailure('network', { cause: error });
    }
  }
  return new WeightFailure('unknown', {
    cause: error instanceof Error ? error : undefined,
  });
}

export class FirebaseWeightRepository implements WeightRepository {
  constructor(private readonly database: Firestore = initializeFirestore()) {}

  async listPage(
    userId: string,
    pageSize: number,
    cursor?: WeightPageCursor,
  ): Promise<WeightPage> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('Data', 'desc'),
        orderBy(documentId(), 'desc'),
        queryLimit(pageSize),
      ];
      if (cursor) constraints.push(startAfter(cursor.recordedOn, cursor.id));
      const snapshot = await getDocs(
        query(collection(this.database, collectionPath(userId)), ...constraints),
      );
      const entries = snapshot.docs.map((item) =>
        mapWeightEntryDocument(item.id, item.data()),
      );
      const last = entries.at(-1);
      return {
        entries,
        nextCursor:
          entries.length === pageSize && last
            ? { id: last.id, recordedOn: last.recordedOn }
            : null,
      };
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }

  async upsert(userId: string, draft: WeightEntryDraft): Promise<void> {
    try {
      const reference = doc(this.database, collectionPath(userId), draft.recordedOn);
      await runTransaction(this.database, async (transaction) => {
        const existing = await transaction.get(reference);
        const timestamp = serverTimestamp();
        transaction.set(
          reference,
          {
            Data: draft.recordedOn,
            Peso: draft.weightKg,
            schemaVersion: 1,
            ...(!existing.exists() || !existing.data().createdAt
              ? { createdAt: timestamp }
              : {}),
            updatedAt: timestamp,
          },
          { merge: true },
        );
      });
    } catch (error) {
      throw mapFirestoreFailure(error);
    }
  }
}

export function createFirebaseWeightRepository(): WeightRepository {
  return new FirebaseWeightRepository();
}
