import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { configureTelemetryRuntime } from './error-reporter';

const variant = Constants.expoConfig?.extra?.appVariant;
configureTelemetryRuntime({
  appVersion: Constants.expoConfig?.version ?? 'unknown',
  platform: Platform.OS,
  variant: typeof variant === 'string' ? variant : 'unknown',
});

export function TelemetryLifecycle() {
  return null;
}
