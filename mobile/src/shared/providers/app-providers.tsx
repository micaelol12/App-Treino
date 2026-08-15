import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/presentation/auth-context';
import { createFirebaseAuthGateway } from '@/features/auth/infrastructure/firebase/firebase-auth.gateway';
import { createFirebaseWorkoutPlanRepository } from '@/features/workout-plans/infrastructure/firestore/firebase-workout-plan.repository';
import { WorkoutPlanProvider } from '@/features/workout-plans/presentation/workout-plan-context';
import { createQueryClient } from '@/shared/lib/query-client';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AuthProvider gatewayFactory={createFirebaseAuthGateway}>
            <WorkoutPlanProvider repositoryFactory={createFirebaseWorkoutPlanRepository}>
              {children}
            </WorkoutPlanProvider>
          </AuthProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
