import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { canBypassAdminClaim } from '../config/environment';
import { auth } from '../lib/firebase';

type AuthStatus = 'loading' | 'anonymous' | 'forbidden' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(
    () =>
      onIdTokenChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (!currentUser) {
          setStatus('anonymous');
          return;
        }

        const token = await currentUser.getIdTokenResult();
        setStatus(token.claims.admin === true || canBypassAdminClaim ? 'authenticated' : 'forbidden');
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signOut: async () => {
        await firebaseSignOut(auth);
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return value;
}
