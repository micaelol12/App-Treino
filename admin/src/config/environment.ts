import { z } from 'zod';

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional(),
);

const environmentSchema = z.object({
  apiKey: z.string().trim().min(1),
  authDomain: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  storageBucket: z.string().trim().min(1),
  messagingSenderId: z.string().trim().min(1),
  appId: z.string().trim().min(1),
  authEmulatorUrl: optionalString,
  firestoreEmulatorHost: optionalString,
  storageEmulatorHost: optionalString,
  adminAuthBypass: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
});

export const environment = environmentSchema.parse({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  authEmulatorUrl: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL,
  firestoreEmulatorHost: import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST,
  storageEmulatorHost: import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST,
  adminAuthBypass: import.meta.env.VITE_ADMIN_AUTH_BYPASS ?? 'false',
});

export const canBypassAdminClaim =
  import.meta.env.DEV && Boolean(environment.authEmulatorUrl) && environment.adminAuthBypass;
