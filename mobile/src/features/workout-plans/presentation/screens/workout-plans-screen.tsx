import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';

import { WorkoutPlansSection } from '../components/workout-plans-section';
import { useWorkoutPlanExercises } from '../workout-plan-hooks';

export function WorkoutPlansScreen() {
  const router = useRouter();
  const plans = useWorkoutPlanExercises();

  return (
    <Screen
      title="Plano de treino"
      description="Organize exercícios por divisão e ordem."
      action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
      onRefresh={() => plans.refetch()}
      refreshing={plans.isRefetching}
    >
      <WorkoutPlansSection plans={plans} showHeading={false} />
    </Screen>
  );
}
