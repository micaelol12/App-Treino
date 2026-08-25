import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  NestableDraggableFlatList,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

import type { WorkoutPlanExercise } from '../../domain/workout-plan-exercise';
import { useExerciseCatalog } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import { ExerciseMetadataChips } from '@/features/exercise-catalog/presentation/components/exercise-metadata-chips';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { DragHandle } from '@/shared/components/drag-handle';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { useScreenScrollHandler } from '@/shared/components/screen';
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

export function calculateWorkoutProgressForExercise(
  catalog: readonly Exercise[],
  exercises: readonly WorkoutPlanExercise[],
): MetricChartPoint[] {
  const selectedExercises =
    catalog?.filter(({ documentId }) =>
      exercises.some((exercise) => exercise.exerciseDocumentId === documentId),
    ) ?? [];

  const muscleScores = selectedExercises.reduce<Record<string, number>>(
    (acc, exercise) => {
      exercise.primaryMuscles.forEach((muscle) => {
        acc[muscle] = (acc[muscle] ?? 0) + 1;
      });

      exercise.secondaryMuscles.forEach((muscle) => {
        acc[muscle] = (acc[muscle] ?? 0) + 0.15;
      });

      return acc;
    },
    {},
  );

  const total = Object.values(muscleScores).reduce((sum, value) => sum + value, 0);

  const points = Object.entries(muscleScores).map(([label, score]) => ({
    label,
    value: total > 0 ? Number(((score / total) * 100).toFixed(1)) : 0,
  }));

  return points;
}

export function WorkoutPlansSection({
  plans,
  divisionId,
  showHeading = true,
}: WorkoutPlansSectionProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const screenScrollHandler = useScreenScrollHandler();
  const { remove, reorder } = useWorkoutPlanActions();
  const catalog = useExerciseCatalog();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const isMutating = reorder.isPending || remove.isPending;
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

  const hasLegacyItem = exercises.some(
    ({ sourceSchemaVersion }) => sourceSchemaVersion < 2,
  );
  const canReorder = Boolean(divisionId) && !hasLegacyItem;

  const persistOrder = async (orderedExercises: readonly WorkoutPlanExercise[]) => {
    if (!divisionId || !canReorder || isMutating) return;
    const orderedIds = orderedExercises.map(({ id }) => id);
    if (orderedIds.every((id, index) => id === exercises[index]?.id)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await reorder.mutateAsync({ divisionId, orderedExerciseIds: orderedIds });
      setActionSuccess('Ordem atualizada.');
    } catch (error) {
      setActionError(getWorkoutPlanErrorMessage(error));
    }
  };

  const moveByAccessibility = (index: number, direction: 'before' | 'after') => {
    const target = direction === 'before' ? index - 1 : index + 1;
    if (!canReorder || isMutating || target < 0 || target >= exercises.length) return;
    const next = [...exercises];
    const current = next[index];
    const adjacent = next[target];
    if (!current || !adjacent) return;
    next[index] = adjacent;
    next[target] = current;
    void persistOrder(next);
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

  const points = useMemo(
    () => calculateWorkoutProgressForExercise(catalog.data ?? [], exercises),
    [catalog.data, exercises],
  );

  const renderExercise = ({
    drag,
    getIndex,
    isActive,
    item: exercise,
  }: RenderItemParams<WorkoutPlanExercise>) => {
    const index = getIndex() ?? exercises.findIndex(({ id }) => id === exercise.id);
    const catalogExercise = catalog.data?.find(
      ({ documentId }) => documentId === exercise.exerciseDocumentId,
    );
    return (
      <View
        style={[
          styles.draggableCard,
          isActive && {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surfaceMuted,
            elevation: 8,
            opacity: 0.9,
            transform: [{ scale: 1.01 }],
          },
        ]}
      >
        <Card>
          <View style={styles.exerciseHeader}>
            <DragHandle
              disabled={!canReorder || isMutating}
              drag={drag}
              itemName={exercise.name}
              onMove={(direction) => moveByAccessibility(index, direction)}
              position={index + 1}
              total={exercises.length}
            />
            <View style={styles.exerciseCopy}>
              <AppText style={styles.exerciseName}>{exercise.name}</AppText>
              <AppText style={{ color: theme.colors.textMuted }}>
                {exercise.defaultSets} séries
                {exercise.sourceSchemaVersion < 2 ? ' · legado' : ''}
              </AppText>
              {catalogExercise ? (
                <ExerciseMetadataChips exercise={catalogExercise} />
              ) : null}
            </View>
          </View>
          <View style={styles.actions}>
            <WorkoutPlanAction
              disabled={isMutating}
              label="Editar"
              onPress={() => openExercise(exercise.id)}
              testID={`workout-plan-edit-${exercise.id}`}
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
      </View>
    );
  };

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
            disabled={isMutating}
            label="Adicionar"
            onPress={() => openExercise('novo')}
            testID="workout-plan-add"
          />
        </View>
      ) : (
        <WorkoutPlanAction
          disabled={isMutating}
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

      {plans.isSuccess && hasLegacyItem && divisionId ? (
        <AppText accessibilityRole="alert" style={{ color: theme.colors.warning }}>
          Migre os itens legados desta divisão antes de reordenar.
        </AppText>
      ) : null}

      {plans.isSuccess && exercises.length ? (
        <NestableDraggableFlatList
          activationDistance={24}
          contentContainerStyle={styles.list}
          data={exercises}
          keyExtractor={({ id }) => id}
          nestedScrollEnabled
          onDragEnd={({ data }) => void persistOrder(data)}
          renderItem={renderExercise}
          simultaneousHandlers={screenScrollHandler ?? undefined}
          testID="workout-exercises-draggable-list"
        />
      ) : null}

      {plans.isSuccess && exercises.length > 0 ? (
        <Card>
          <AppText variant="heading">Divisão Muscular</AppText>
          <MetricChart
            kind="horizontalBar"
            showLengend={false}
            accessibilitySummary="Divisão Muscular"
            series={[
              {
                name: '',
                color: theme.colors.primary,
                points,
              },
            ]}
          />
        </Card>
      ) : null}

      {plans.isSuccess && exercises.length > 0 ? (
        <WorkoutPlanAction
          disabled={plans.isFetching || isMutating}
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
  list: { gap: spacing.sm },
  draggableCard: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
  },
});
