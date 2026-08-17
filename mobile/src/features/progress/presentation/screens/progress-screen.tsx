import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useWorkoutPlanExercises } from '@/features/workout-plans/presentation/workout-plan-hooks';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { MetricChart } from '@/shared/components/metric-chart';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { calculateWorkoutProgress } from '../../domain/workout-progress';
import { getProgressErrorMessage } from '../progress-error-message';
import { useExerciseProgress } from '../progress-hooks';

function shortDate(value: string): string {
  return `${value.slice(8, 10)}/${value.slice(5, 7)}`;
}

export function ProgressScreen() {
  const theme = useAppTheme();
  const plans = useWorkoutPlanExercises();
  const [selectedExercise, setSelectedExercise] = useState('');
  const exerciseNames = useMemo(
    () => [...new Set((plans.data ?? []).map((exercise) => exercise.name))].sort(),
    [plans.data],
  );
  const effectiveExercise = selectedExercise || exerciseNames[0] || '';
  const history = useExerciseProgress(effectiveExercise);
  const records = useMemo(
    () => history.data?.pages.flatMap((page) => page.records) ?? [],
    [history.data],
  );
  const points = useMemo(() => calculateWorkoutProgress(records), [records]);
  const chartPoints = (metric: 'estimatedOneRepMaxKg' | 'maxLoadKg' | 'volumeKg') =>
    points.map((point) => ({
      label: shortDate(point.performedOn),
      value: point[metric],
    }));

  return (
    <Screen
      title="Evolução"
      description="Compare carga máxima, 1RM estimada e volume por sessão."
    >
      {plans.isLoading ? (
        <Card>
          <AppText accessibilityLiveRegion="polite">Carregando exercícios…</AppText>
        </Card>
      ) : null}
      {plans.isError ? (
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            Não foi possível carregar os exercícios.
          </AppText>
          <PrimaryButton label="Tentar novamente" onPress={() => void plans.refetch()} />
        </Card>
      ) : null}
      {plans.isSuccess && exerciseNames.length === 0 ? (
        <EmptyState
          title="Nenhum exercício configurado"
          description="Adicione exercícios na aba Ajustes para consultar a evolução."
        />
      ) : null}
      {exerciseNames.length > 0 ? (
        <Card>
          <AppText variant="heading">Exercício</AppText>
          <View accessibilityRole="radiogroup" style={styles.filters}>
            {exerciseNames.map((exerciseName) => {
              const selected = exerciseName === effectiveExercise;
              return (
                <Pressable
                  accessibilityLabel={exerciseName}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={exerciseName}
                  onPress={() => setSelectedExercise(exerciseName)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : theme.colors.surfaceMuted,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      color: selected ? theme.colors.onPrimary : theme.colors.text,
                    }}
                  >
                    {exerciseName}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      {history.isLoading ? (
        <Card>
          <AppText accessibilityLiveRegion="polite">Calculando evolução…</AppText>
        </Card>
      ) : null}
      {history.isError ? (
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {getProgressErrorMessage(history.error)}
          </AppText>
          <PrimaryButton
            disabled={history.isFetching}
            label={history.isFetching ? 'Atualizando…' : 'Tentar novamente'}
            onPress={() => void history.refetch()}
          />
        </Card>
      ) : null}
      {history.isSuccess && points.length === 0 && effectiveExercise ? (
        <EmptyState
          title="Sem histórico para este exercício"
          description="Conclua um treino ou faça um registro manual para gerar os indicadores."
        />
      ) : null}

      {points.length > 0 ? (
        <>
          <Card>
            <AppText variant="heading">Carga máxima</AppText>
            <MetricChart
              accessibilitySummary={`Carga máxima em ${points.length} sessões. Último valor: ${points.at(-1)?.maxLoadKg.toFixed(1)} quilogramas.`}
              series={[
                {
                  name: 'Carga (kg)',
                  color: theme.colors.primary,
                  points: chartPoints('maxLoadKg'),
                },
              ]}
            />
          </Card>
          <Card>
            <AppText variant="heading">1RM estimada</AppText>
            <AppText style={{ color: theme.colors.textMuted }}>
              Fórmula de Epley: carga × (1 + repetições ÷ 30).
            </AppText>
            <MetricChart
              accessibilitySummary={`Um RM estimada em ${points.length} sessões. Último valor: ${points.at(-1)?.estimatedOneRepMaxKg.toFixed(1)} quilogramas.`}
              series={[
                {
                  name: '1RM (kg)',
                  color: theme.colors.success,
                  points: chartPoints('estimatedOneRepMaxKg'),
                },
              ]}
            />
          </Card>
          <Card>
            <AppText variant="heading">Volume</AppText>
            <MetricChart
              accessibilitySummary={`Volume total em ${points.length} sessões. Último valor: ${points.at(-1)?.volumeKg.toFixed(1)} quilogramas.`}
              kind="bar"
              series={[
                {
                  name: 'Volume (kg)',
                  color: theme.colors.primary,
                  points: chartPoints('volumeKg'),
                },
              ]}
            />
          </Card>
          {history.hasNextPage ? (
            <SecondaryButton
              disabled={history.isFetchingNextPage}
              label={
                history.isFetchingNextPage ? 'Carregando…' : 'Carregar histórico anterior'
              }
              onPress={() => void history.fetchNextPage()}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filter: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
