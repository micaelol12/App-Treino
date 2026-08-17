import type { ExpoConfig } from 'expo/config';

type AppVariant = 'development' | 'staging' | 'production';

const variants: Record<
  AppVariant,
  { name: string; scheme: string; bundleSuffix: string }
> = {
  development: {
    name: 'App Treino (Dev)',
    scheme: 'apptreino-dev',
    bundleSuffix: '.development',
  },
  staging: {
    name: 'App Treino (Staging)',
    scheme: 'apptreino-staging',
    bundleSuffix: '.staging',
  },
  production: { name: 'App Treino', scheme: 'apptreino', bundleSuffix: '' },
};

const requestedVariant = process.env.APP_VARIANT ?? 'development';

if (!(requestedVariant in variants)) {
  throw new Error(
    `APP_VARIANT inválido: "${requestedVariant}". Use development, staging ou production.`,
  );
}

const appVariant = requestedVariant as AppVariant;
const variant = variants[appVariant];

const config: ExpoConfig = {
  name: variant.name,
  slug: 'app-treino',
  version: '0.8.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  scheme: variant.scheme,
  platforms: ['android', 'ios'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: `com.micael.apptreino${variant.bundleSuffix}`,
  },
  android: { package: `com.micael.apptreino${variant.bundleSuffix}` },
  plugins: ['expo-router', 'expo-dev-client', 'expo-splash-screen'],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { appVariant },
};

export default config;
