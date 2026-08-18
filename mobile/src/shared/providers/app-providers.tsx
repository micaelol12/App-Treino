import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/presentation/auth-context';
import { createFirebaseAuthGateway } from '@/features/auth/infrastructure/firebase/firebase-auth.gateway';
import { createFirebaseExerciseCatalogRepository } from '@/features/exercise-catalog/infrastructure/firestore/firebase-exercise-catalog.repository';
import { ExerciseCatalogProvider } from '@/features/exercise-catalog/presentation/exercise-catalog-context';
import { createFirebaseWorkoutPlanRepository } from '@/features/workout-plans/infrastructure/firestore/firebase-workout-plan.repository';
import { WorkoutPlanProvider } from '@/features/workout-plans/presentation/workout-plan-context';
import { createFirebaseWorkoutDivisionRepository } from '@/features/workout-divisions/infrastructure/firestore/firebase-workout-division.repository';
import { WorkoutDivisionProvider } from '@/features/workout-divisions/presentation/workout-division-context';
import { createFirebaseWorkoutSessionRepository } from '@/features/workout-session/infrastructure/firestore/firebase-workout-session.repository';
import { useActiveWorkoutStore } from '@/features/workout-session/presentation/active-workout.store';
import { WorkoutSessionProvider } from '@/features/workout-session/presentation/workout-session-context';
import { createFirebaseProgressRepository } from '@/features/progress/infrastructure/firestore/firebase-progress.repository';
import { ProgressProvider } from '@/features/progress/presentation/progress-context';
import { createFirebaseWeightRepository } from '@/features/weight/infrastructure/firestore/firebase-weight.repository';
import { WeightProvider } from '@/features/weight/presentation/weight-context';
import { createQueryClient } from '@/shared/lib/query-client';
import { NetworkLifecycle } from '@/shared/network/network-lifecycle';
import { AppThemeProvider } from '@/shared/theme/theme-provider';
import { TelemetryLifecycle } from '@/shared/telemetry/telemetry-lifecycle';

function ActiveWorkoutLifecycle() {
  const { isLoading, session } = useAuth();
  const draft = useActiveWorkoutStore((state) => state.draft);
  const hasHydrated = useActiveWorkoutStore((state) => state.hasHydrated);
  const clear = useActiveWorkoutStore((state) => state.clear);

  useEffect(() => {
    if (!hasHydrated || isLoading) return;
    if (!session || (draft && draft.userId !== session.uid)) clear();
  }, [clear, draft, hasHydrated, isLoading, session]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AuthProvider gatewayFactory={createFirebaseAuthGateway}>
            <ActiveWorkoutLifecycle />
            <NetworkLifecycle />
            <TelemetryLifecycle />
            <WorkoutSessionProvider
              repositoryFactory={createFirebaseWorkoutSessionRepository}
            >
              <ExerciseCatalogProvider
                repositoryFactory={createFirebaseExerciseCatalogRepository}
              >
                <WorkoutDivisionProvider
                  repositoryFactory={createFirebaseWorkoutDivisionRepository}
                >
                  <WorkoutPlanProvider
                    repositoryFactory={createFirebaseWorkoutPlanRepository}
                  >
                    <WeightProvider repositoryFactory={createFirebaseWeightRepository}>
                      <ProgressProvider
                        repositoryFactory={createFirebaseProgressRepository}
                      >
                        {children}
                      </ProgressProvider>
                    </WeightProvider>
                  </WorkoutPlanProvider>
                </WorkoutDivisionProvider>
              </ExerciseCatalogProvider>
            </WorkoutSessionProvider>
          </AuthProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
