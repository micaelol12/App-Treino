import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useWorkoutPlanExercises } from '@/features/workout-plans/presentation/workout-plan-hooks';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { InfoModal } from '@/shared/components/info-modal';
import { MetricChart } from '@/shared/components/metric-chart';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SearchableSelect } from '@/shared/components/searchable-select';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';

import { calculateWorkoutProgress } from '../../domain/workout-progress';
import { getProgressErrorMessage } from '../progress-error-message';
import { useExerciseProgress } from '../progress-hooks';

function shortDate(value: string): string {
  return `${value.slice(8, 10)}/${value.slice(5, 7)}`;
}

export function ProgressScreen() {
  const theme = useAppTheme();
  const plans = useWorkoutPlanExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const exercises = useMemo(() => {
    const unique = new Map(
      (plans.data ?? []).map((exercise) => [exercise.exerciseId, exercise]),
    );
    return [...unique.values()].sort((left, right) =>
      left.name.localeCompare(right.name, 'pt-BR'),
    );
  }, [plans.data]);
  const effectiveExercise =
    exercises.find(({ exerciseId }) => exerciseId === selectedExerciseId) ?? exercises[0];
  const history = useExerciseProgress(
    effectiveExercise?.exerciseId ?? '',
    effectiveExercise?.name ?? '',
  );
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
      onRefresh={() =>
        Promise.all([plans.refetch(), ...(effectiveExercise ? [history.refetch()] : [])])
      }
      refreshing={plans.isRefetching || history.isRefetching}
      action={
        <Pressable
          accessibilityHint="Explica como interpretar os gráficos"
          accessibilityLabel="Ajuda sobre os gráficos"
          accessibilityRole="button"
          onPress={() => setHelpOpen(true)}
          style={styles.helpButton}
          testID="progress-help"
        >
          <Ionicons color={theme.colors.primary} name="help-circle-outline" size={30} />
        </Pressable>
      }
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
      {plans.isSuccess && exercises.length === 0 ? (
        <EmptyState
          title="Nenhum exercício configurado"
          description="Adicione exercícios na aba Ajustes para consultar a evolução."
        />
      ) : null}
      {exercises.length > 0 ? (
        <Card>
          <SearchableSelect
            label="Exercício"
            onChange={setSelectedExerciseId}
            options={exercises.map((exercise) => ({
              value: exercise.exerciseId,
              label: exercise.name,
              description: exercise.division,
            }))}
            testID="progress-exercise-select"
            value={effectiveExercise?.exerciseId ?? ''}
          />
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
      <InfoModal
        onClose={() => setHelpOpen(false)}
        title="Como interpretar os gráficos"
        visible={helpOpen}
      >
        <AppText variant="heading">Carga máxima</AppText>
        <AppText style={{ color: theme.colors.textMuted }}>
          É a maior carga registrada em uma série daquele exercício na sessão.
        </AppText>
        <AppText variant="heading">1RM estimada</AppText>
        <AppText style={{ color: theme.colors.textMuted }}>
          Estima a carga de uma repetição pela fórmula de Epley: carga × (1 + repetições ÷
          30). É uma referência, não um teste máximo real.
        </AppText>
        <AppText variant="heading">Volume</AppText>
        <AppText style={{ color: theme.colors.textMuted }}>
          Soma carga × repetições de todas as séries da sessão. O eixo horizontal mostra
          as datas e o vertical mostra o valor da métrica.
        </AppText>
      </InfoModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  helpButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
