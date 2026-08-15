import 'firebase/auth';

declare module 'firebase/auth' {
  type ReactNativeAuthStorage = {
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    setItem(key: string, value: string): Promise<void>;
  };

  export function getReactNativePersistence(storage: ReactNativeAuthStorage): Persistence;
}
