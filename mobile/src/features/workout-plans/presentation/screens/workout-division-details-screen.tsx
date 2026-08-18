import { useRouter } from 'expo-router';

import { useWorkoutDivisions } from '@/features/workout-divisions/presentation/workout-division-hooks';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';

import { WorkoutPlansSection } from '../components/workout-plans-section';
import { useWorkoutPlanExercises } from '../workout-plan-hooks';

export function WorkoutDivisionDetailsScreen({ divisionId }: { divisionId: string }) {
  const router = useRouter();
  const divisions = useWorkoutDivisions();
  const plans = useWorkoutPlanExercises();
  const division = divisions.data?.find(({ id }) => id === divisionId);

  if (divisions.isLoading) {
    return (
      <Screen title="Divisão de treino">
        <Card>
          <AppText>Carregando divisão…</AppText>
        </Card>
      </Screen>
    );
  }

  if (divisions.isError) {
    return (
      <Screen title="Divisão de treino">
        <Card>
          <AppText accessibilityRole="alert">
            Não foi possível carregar a divisão.
          </AppText>
          <PrimaryButton
            label="Tentar novamente"
            onPress={() => void divisions.refetch()}
          />
        </Card>
      </Screen>
    );
  }

  if (!division) {
    return (
      <Screen title="Divisão de treino">
        <EmptyState
          title="Divisão não encontrada"
          description="Ela pode ter sido removida em outro dispositivo."
        />
        <PrimaryButton label="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      title={division.name}
      description={`Ordem ${division.order} · ${division.active ? 'ativa' : 'inativa'}`}
      action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
      onRefresh={() => Promise.all([divisions.refetch(), plans.refetch()])}
      refreshing={divisions.isRefetching || plans.isRefetching}
    >
      <WorkoutPlansSection divisionId={division.id} plans={plans} />
    </Screen>
  );
}
