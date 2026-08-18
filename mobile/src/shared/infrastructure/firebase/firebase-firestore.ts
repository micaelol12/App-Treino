import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

import { getFirebaseClient } from './firebase-app';

const connectedEmulatorDatabases = new WeakSet<Firestore>();

export function getFirebaseFirestore(): Firestore {
  const { app, firestoreEmulatorUrl } = getFirebaseClient();
  const database = getFirestore(app);

  if (firestoreEmulatorUrl && !connectedEmulatorDatabases.has(database)) {
    const url = new URL(firestoreEmulatorUrl);
    connectFirestoreEmulator(database, url.hostname, Number(url.port));
    connectedEmulatorDatabases.add(database);
  }

  return database;
}
