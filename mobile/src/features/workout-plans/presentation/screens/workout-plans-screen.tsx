import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { WorkoutDivisionsSection } from '@/features/workout-divisions/presentation/components/workout-divisions-section';
import { useWorkoutDivisions } from '@/features/workout-divisions/presentation/workout-division-hooks';

export function WorkoutPlansScreen() {
  const router = useRouter();
  const divisions = useWorkoutDivisions();

  return (
    <Screen
      title="Plano de treino"
      description="Cadastre e organize suas divisões de treino."
      action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
      onRefresh={() => divisions.refetch()}
      refreshing={divisions.isRefetching}
    >
      <WorkoutDivisionsSection />
    </Screen>
  );
}
