import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/shared/lib/query-client';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>{children}</AppThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
