import { type Href, useRouter } from 'expo-router';

import { Screen } from '@/shared/components/screen';
import { Card } from '@/shared/components/card';
import { AppText } from '@/shared/components/app-text';
import { PrimaryButton } from '@/shared/components/primary-button';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { WorkoutDivisionsSection } from '@/features/workout-divisions/presentation/components/workout-divisions-section';
import { useWorkoutDivisions } from '@/features/workout-divisions/presentation/workout-division-hooks';

export function WorkoutPlansScreen() {
  const router = useRouter();
  const divisions = useWorkoutDivisions();

  return (
    <Screen
      nestedScroll
      title="Plano de treino"
      description="Cadastre e organize suas divisões de treino."
      action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
      onRefresh={() => divisions.refetch()}
      refreshing={divisions.isRefetching}
    >
      <Card>
        <AppText variant="heading">Comece com uma divisão pronta</AppText>
        <AppText>
          Escolha uma divisão publicada pela equipe e personalize no seu plano.
        </AppText>
        <PrimaryButton
          label="Escolher divisão pronta"
          onPress={() => router.push('/configuracoes/divisoes-prontas' as Href)}
          testID="workout-plan-browse-templates"
        />
      </Card>
      <WorkoutDivisionsSection />
    </Screen>
  );
}
