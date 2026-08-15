import { type AuthSession } from '../domain/auth-session';

export type AuthCredentials = {
  readonly email: string;
  readonly password: string;
};

export type AuthStateListener = (session: AuthSession | null) => void;
export type AuthErrorListener = (error: Error) => void;
export type UnsubscribeAuthState = () => void;

export interface AuthGateway {
  subscribe(
    listener: AuthStateListener,
    onError?: AuthErrorListener,
  ): UnsubscribeAuthState;
  signIn(credentials: AuthCredentials): Promise<void>;
  signUp(credentials: AuthCredentials): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
}
