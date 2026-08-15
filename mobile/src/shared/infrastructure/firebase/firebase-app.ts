import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

import { parsePublicEnvironment } from '@/shared/config/environment';

export type FirebaseClient = {
  readonly app: FirebaseApp;
  readonly authEmulatorUrl: string | undefined;
};

export function getFirebaseClient(): FirebaseClient {
  const environment = parsePublicEnvironment();
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: environment.firebaseApiKey,
        authDomain: environment.firebaseAuthDomain,
        projectId: environment.firebaseProjectId,
        storageBucket: environment.firebaseStorageBucket,
        messagingSenderId: environment.firebaseMessagingSenderId,
        appId: environment.firebaseAppId,
      });

  return { app, authEmulatorUrl: environment.firebaseAuthEmulatorUrl };
}
