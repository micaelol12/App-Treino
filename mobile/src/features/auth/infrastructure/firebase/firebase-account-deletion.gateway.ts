import { FirebaseError } from 'firebase/app';
import {
  collection,
  getDocs,
  limit,
  query,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { AuthFailure } from '../../application/auth-failure';
import { getFirebaseFirestore } from '@/shared/infrastructure/firebase/firebase-firestore';

const ACCOUNT_COLLECTIONS = [
  'config_treinos',
  'historico_treinos',
  'historico_pesos',
  'migracoes',
] as const;
const DELETE_BATCH_SIZE = 450;
function initializeFirestore(): Firestore {
  return getFirebaseFirestore();
}

async function deleteCollection(database: Firestore, path: string): Promise<void> {
  while (true) {
    const snapshot = await getDocs(
      query(collection(database, path), limit(DELETE_BATCH_SIZE)),
    );
    if (snapshot.empty) return;

    const batch = writeBatch(database);
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
}

export async function deleteAccountDocuments(
  userId: string,
  database: Firestore = initializeFirestore(),
): Promise<void> {
  try {
    const divisions = await getDocs(collection(database, `usuarios/${userId}/divisoes`));
    for (const division of divisions.docs) {
      await deleteCollection(
        database,
        `usuarios/${userId}/divisoes/${division.id}/exercicios`,
      );
    }
    await deleteCollection(database, `usuarios/${userId}/divisoes`);
    for (const collectionName of ACCOUNT_COLLECTIONS) {
      await deleteCollection(database, `usuarios/${userId}/${collectionName}`);
    }
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'unavailable' || error.code === 'deadline-exceeded')
    ) {
      throw new AuthFailure('network', { cause: error });
    }

    throw new AuthFailure('unknown', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}
