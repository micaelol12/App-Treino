import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { type AuthCredentials, type AuthGateway } from '../application/auth-gateway';
import { AuthFailure } from '../application/auth-failure';
import { type AuthSession } from '../domain/auth-session';

type AuthContextValue = {
  readonly isLoading: boolean;
  readonly session: AuthSession | null;
  readonly startupError: Error | null;
  signIn(credentials: AuthCredentials): Promise<void>;
  signUp(credentials: AuthCredentials): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(password: string): Promise<void>;
};

type AuthProviderProps = PropsWithChildren<{
  gatewayFactory: () => AuthGateway;
}>;

type AuthInitialization =
  { gateway: AuthGateway; error: null } | { gateway: null; error: Error };

const AuthContext = createContext<AuthContextValue | null>(null);

function initializeGateway(gatewayFactory: () => AuthGateway): AuthInitialization {
  try {
    return { gateway: gatewayFactory(), error: null };
  } catch (error) {
    return {
      gateway: null,
      error: error instanceof Error ? error : new AuthFailure('configuration'),
    };
  }
}

export function AuthProvider({ children, gatewayFactory }: AuthProviderProps) {
  const [initialization] = useState(() => initializeGateway(gatewayFactory));
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(initialization.gateway !== null);
  const [startupError, setStartupError] = useState<Error | null>(initialization.error);

  useEffect(() => {
    if (!initialization.gateway) {
      return;
    }

    return initialization.gateway.subscribe(
      (nextSession) => {
        setSession(nextSession);
        setStartupError(null);
        setIsLoading(false);
      },
      (error) => {
        setSession(null);
        setStartupError(error);
        setIsLoading(false);
      },
    );
  }, [initialization]);

  const gatewayOrThrow = useCallback(() => {
    if (!initialization.gateway) {
      throw new AuthFailure('configuration', { cause: initialization.error });
    }

    return initialization.gateway;
  }, [initialization]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      startupError,
      signIn: (credentials) => gatewayOrThrow().signIn(credentials),
      signUp: (credentials) => gatewayOrThrow().signUp(credentials),
      sendPasswordReset: (email) => gatewayOrThrow().sendPasswordReset(email),
      signOut: () => gatewayOrThrow().signOut(),
      deleteAccount: (password) => gatewayOrThrow().deleteAccount(password),
    }),
    [gatewayOrThrow, isLoading, session, startupError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
