import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

import { type AuthCredentials, type AuthGateway } from '../../application/auth-gateway';
import { AuthFailure } from '../../application/auth-failure';
import { type AuthSession } from '../../domain/auth-session';
import { getFirebaseClient } from '@/shared/infrastructure/firebase/firebase-app';

import { mapFirebaseAuthError } from './firebase-auth-error';

function initializeFirebaseAuth(): Auth {
  try {
    const { app, authEmulatorUrl } = getFirebaseClient();
    let auth: Auth;

    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      if (
        !(error instanceof FirebaseError) ||
        error.code !== 'auth/already-initialized'
      ) {
        throw error;
      }

      auth = getAuth(app);
    }

    if (authEmulatorUrl && !auth.emulatorConfig) {
      connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    }

    return auth;
  } catch (error) {
    throw new AuthFailure('configuration', {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

function toSession(user: { uid: string; email: string | null }): AuthSession | null {
  return user.email ? { uid: user.uid, email: user.email } : null;
}

export class FirebaseAuthGateway implements AuthGateway {
  constructor(private readonly auth: Auth = initializeFirebaseAuth()) {}

  subscribe(
    listener: (session: AuthSession | null) => void,
    onError?: (error: Error) => void,
  ) {
    return onAuthStateChanged(
      this.auth,
      (user) => listener(user ? toSession(user) : null),
      (error) => onError?.(mapFirebaseAuthError(error)),
    );
  }

  async signIn({ email, password }: AuthCredentials): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async signUp({ email, password }: AuthCredentials): Promise<void> {
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }
}

export function createFirebaseAuthGateway(): AuthGateway {
  return new FirebaseAuthGateway();
}
