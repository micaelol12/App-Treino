import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

import { environment } from '../config/environment';

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: environment.apiKey,
      authDomain: environment.authDomain,
      projectId: environment.projectId,
      storageBucket: environment.storageBucket,
      messagingSenderId: environment.messagingSenderId,
      appId: environment.appId,
    });

export const auth = getAuth(app);
export const database = getFirestore(app);
export const storage = getStorage(app);

if (environment.authEmulatorUrl) {
  connectAuthEmulator(auth, environment.authEmulatorUrl, { disableWarnings: true });
}

function parseHost(value: string): { host: string; port: number } {
  const url = new URL(value.includes('://') ? value : `http://${value}`);
  return { host: url.hostname, port: Number(url.port) };
}

if (environment.firestoreEmulatorHost) {
  const emulator = parseHost(environment.firestoreEmulatorHost);
  connectFirestoreEmulator(database, emulator.host, emulator.port);
}

if (environment.storageEmulatorHost) {
  const emulator = parseHost(environment.storageEmulatorHost);
  connectStorageEmulator(storage, emulator.host, emulator.port);
}
