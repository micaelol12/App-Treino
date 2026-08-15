import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/features/auth/presentation/auth-context';
import { AuthLoadingScreen } from '@/features/auth/presentation/components/auth-loading-screen';
import { AppErrorBoundary } from '@/shared/components/app-error-boundary';
import { AppProviders } from '@/shared/providers/app-providers';
import { useAppTheme } from '@/shared/theme/theme-provider';

function RootNavigator() {
  const theme = useAppTheme();
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </AppErrorBoundary>
  );
}
