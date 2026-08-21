import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import type { WorkoutPlanExercise } from '../../domain/workout-plan-exercise';
import { useExerciseCatalog } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import { ExerciseMetadataChips } from '@/features/exercise-catalog/presentation/components/exercise-metadata-chips';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { getWorkoutPlanErrorMessage } from '../workout-plan-error-message';
import { useWorkoutPlanActions, useWorkoutPlanExercises } from '../workout-plan-hooks';
import { WorkoutPlanAction } from './workout-plan-action';
import { MetricChart, MetricChartPoint } from '@/shared/components/metric-chart';
import { Exercise } from '@/features/exercise-catalog/domain/exercise';

type WorkoutPlansSectionProps = {
  plans: ReturnType<typeof useWorkoutPlanExercises>;
  divisionId?: string;
  showHeading?: boolean;
};

export function calculateWorkoutProgressForExercise(catalog: readonly Exercise[], exercises: readonly WorkoutPlanExercise[]): MetricChartPoint[] {
  const selectedExercises =
    catalog?.filter(({ documentId }) =>
      exercises.some(
        exercise => exercise.exerciseDocumentId === documentId
      )
    ) ?? [];

  const muscleScores = selectedExercises.reduce<Record<string, number>>(
    (acc, exercise) => {
      exercise.primaryMuscles.forEach(muscle => {
        acc[muscle] = (acc[muscle] ?? 0) + 1;
      });

      exercise.secondaryMuscles.forEach(muscle => {
        acc[muscle] = (acc[muscle] ?? 0) + 0.25;
      });

      return acc;
    },
    {}
  );

  const total = Object.values(muscleScores).reduce(
    (sum, value) => sum + value,
    0
  );

  const points = Object.entries(muscleScores).map(([label, score]) => ({
    label,
    value: total > 0
      ? Number(((score / total) * 100).toFixed(1))
      : 0,
  }));

  return points
}

export function WorkoutPlansSection({
  plans,
  divisionId,
  showHeading = true,
}: WorkoutPlansSectionProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { move, remove } = useWorkoutPlanActions();
  const catalog = useExerciseCatalog();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const isMutating = move.isPending || remove.isPending;
  const exercises = (plans.data ?? []).filter(
    (exercise) => !divisionId || exercise.divisionId === divisionId,
  );

  const openExercise = (id: string) => {
    if (divisionId) {
      router.push({
        pathname: '/configuracoes/divisao/[divisionId]/exercicio/[id]',
        params: { divisionId, id },
      });
      return;
    }
    router.push({ pathname: '/configuracoes/exercicio/[id]', params: { id } });
  };

  const moveExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await move.mutateAsync({ direction, exerciseId });
      setActionSuccess('Ordem atualizada.');
    } catch (error) {
      setActionError(getWorkoutPlanErrorMessage(error));
    }
  };

  const confirmDelete = (exercise: WorkoutPlanExercise) => {
    Alert.alert(
      'Excluir exercício?',
      `${exercise.name} será removido da divisão ${exercise.division}. O histórico de treinos não será apagado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setActionError(null);
            setActionSuccess(null);
            void remove
              .mutateAsync(exercise.id)
              .then(() => setActionSuccess('Exercício excluído.'))
              .catch((error: unknown) => {
                setActionError(getWorkoutPlanErrorMessage(error));
              });
          },
        },
      ],
    );
  };

  const points = useMemo(() => calculateWorkoutProgressForExercise(catalog.data ?? [], exercises), [catalog.data, exercises]);

  return (
    <View style={styles.section}>
      {showHeading ? (
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <AppText variant="heading">Exercícios</AppText>
            <AppText style={{ color: theme.colors.textMuted }}>
              Adicione e organize os exercícios desta divisão.
            </AppText>
          </View>
          <WorkoutPlanAction
            label="Adicionar"
            onPress={() => openExercise('novo')}
            testID="workout-plan-add"
          />
        </View>
      ) : (
        <WorkoutPlanAction
          label="Adicionar exercício"
          onPress={() => openExercise('novo')}
          testID="workout-plan-add"
        />
      )}

      {plans.isLoading ? (
        <Card>
          <AppText accessibilityLiveRegion="polite">Carregando plano…</AppText>
        </Card>
      ) : null}

      {plans.isError ? (
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {getWorkoutPlanErrorMessage(plans.error)}
          </AppText>
          <PrimaryButton
            label={plans.isFetching ? 'Atualizando…' : 'Tentar novamente'}
            disabled={plans.isFetching}
            onPress={() => void plans.refetch()}
            testID="workout-plan-retry"
          />
        </Card>
      ) : null}

      {actionError ? (
        <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {actionError}
        </AppText>
      ) : null}
      {actionSuccess ? (
        <AppText accessibilityLiveRegion="polite" style={{ color: theme.colors.success }}>
          {actionSuccess}
        </AppText>
      ) : null}

      {plans.isSuccess && exercises.length === 0 ? (
        <EmptyState
          title="Nenhum exercício nesta divisão"
          description="Adicione o primeiro exercício para montar esta divisão."
        />
      ) : null}

      {plans.isSuccess && exercises.length > 0 ? (
        <AppText style={{ color: theme.colors.textMuted }}>
          {exercises.length} exercício{exercises.length > 1 ? 's' : ''}
        </AppText>
      ) : null}

      {plans.isSuccess
        ? exercises.map((exercise, index) => {
          const catalogExercise = catalog.data?.find(
            ({ documentId }) => documentId === exercise.exerciseDocumentId,
          );
          return (
            <Card key={exercise.id}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseCopy}>
                  <AppText style={styles.exerciseName}>{exercise.name}</AppText>
                  <AppText style={{ color: theme.colors.textMuted }}>
                    {exercise.defaultSets} séries · ordem {exercise.order}
                    {exercise.sourceSchemaVersion < 2 ? ' · legado' : ''}
                  </AppText>
                  {catalogExercise ? (
                    <ExerciseMetadataChips exercise={catalogExercise} />
                  ) : null}
                </View>
                <WorkoutPlanAction
                  label="Editar"
                  onPress={() => openExercise(exercise.id)}
                  testID={`workout-plan-edit-${exercise.id}`}
                />
              </View>
              <View style={styles.actions}>
                <WorkoutPlanAction
                  disabled={
                    isMutating || index === 0 || exercise.sourceSchemaVersion < 2
                  }
                  label="Subir"
                  onPress={() => void moveExercise(exercise.id, 'up')}
                  testID={`workout-plan-up-${exercise.id}`}
                />
                <WorkoutPlanAction
                  disabled={
                    isMutating ||
                    index === exercises.length - 1 ||
                    exercise.sourceSchemaVersion < 2
                  }
                  label="Descer"
                  onPress={() => void moveExercise(exercise.id, 'down')}
                  testID={`workout-plan-down-${exercise.id}`}
                />
                <WorkoutPlanAction
                  disabled={isMutating || exercise.sourceSchemaVersion < 2}
                  label="Excluir"
                  onPress={() => confirmDelete(exercise)}
                  testID={`workout-plan-delete-${exercise.id}`}
                  tone="danger"
                />
              </View>
            </Card>
          );
        })
        : null}

      {plans.isSuccess && exercises.length > 0 ? (
        <Card>
          <AppText variant="heading">Divisão Muscular</AppText>
          <MetricChart
            kind='horizontalBar'
            showLengend={false}
            accessibilitySummary={`Divisão Muscular`}
            series={[
              {
                name: '',
                color: theme.colors.primary,
                points: points,
              },
            ]}
          />
        </Card>
      ) : null}

      {plans.isSuccess && exercises.length > 0 ? (
        <WorkoutPlanAction
          disabled={plans.isFetching}
          label={plans.isFetching ? 'Atualizando…' : 'Atualizar plano'}
          onPress={() => void plans.refetch()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headingCopy: { flex: 1, gap: spacing.xxs },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseCopy: { flex: 1, gap: spacing.xxs },
  exerciseName: { fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
