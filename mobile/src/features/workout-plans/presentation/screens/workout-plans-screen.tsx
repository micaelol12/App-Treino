import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';

import { WorkoutPlansSection } from '../components/workout-plans-section';

export function WorkoutPlansScreen() {
  const router = useRouter();

  return (
    <Screen
      title="Plano de treino"
      description="Organize exercícios por divisão e ordem."
      action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
    >
      <WorkoutPlansSection showHeading={false} />
    </Screen>
  );
}
