import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import type { WorkoutPlanExercise } from '../../domain/workout-plan-exercise';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { getWorkoutPlanErrorMessage } from '../workout-plan-error-message';
import { useWorkoutPlanActions, useWorkoutPlanExercises } from '../workout-plan-hooks';
import { WorkoutPlanAction } from './workout-plan-action';

function groupByDivision(exercises: readonly WorkoutPlanExercise[]) {
  const groups: { division: string; exercises: WorkoutPlanExercise[] }[] = [];
  for (const exercise of exercises) {
    const current = groups.at(-1);
    if (!current || current.division !== exercise.division) {
      groups.push({ division: exercise.division, exercises: [exercise] });
    } else {
      current.exercises.push(exercise);
    }
  }
  return groups;
}

export function WorkoutPlansSection({ showHeading = true }: { showHeading?: boolean }) {
  const router = useRouter();
  const theme = useAppTheme();
  const plans = useWorkoutPlanExercises();
  const { move, remove } = useWorkoutPlanActions();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const isMutating = move.isPending || remove.isPending;

  const openExercise = (id: string) => {
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

  return (
    <View style={styles.section}>
      {showHeading ? (
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <AppText variant="heading">Plano de treino</AppText>
            <AppText style={{ color: theme.colors.textMuted }}>
              Organize exercícios por divisão e ordem.
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

      {plans.isSuccess && plans.data.length === 0 ? (
        <EmptyState
          title="Seu plano está vazio"
          description="Adicione o primeiro exercício para começar a montar suas divisões."
        />
      ) : null}

      {plans.isSuccess
        ? groupByDivision(plans.data).map((group) => (
            <View key={group.division} style={styles.group}>
              <AppText variant="heading">{group.division}</AppText>
              {group.exercises.map((exercise, index) => (
                <Card key={exercise.id}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseCopy}>
                      <AppText style={styles.exerciseName}>{exercise.name}</AppText>
                      <AppText style={{ color: theme.colors.textMuted }}>
                        {exercise.defaultSets} séries · ordem {exercise.order}
                        {exercise.sourceSchemaVersion === 0 ? ' · legado' : ''}
                      </AppText>
                    </View>
                    <WorkoutPlanAction
                      label="Editar"
                      onPress={() => openExercise(exercise.id)}
                      testID={`workout-plan-edit-${exercise.id}`}
                    />
                  </View>
                  <View style={styles.actions}>
                    <WorkoutPlanAction
                      disabled={isMutating || index === 0}
                      label="Subir"
                      onPress={() => void moveExercise(exercise.id, 'up')}
                      testID={`workout-plan-up-${exercise.id}`}
                    />
                    <WorkoutPlanAction
                      disabled={isMutating || index === group.exercises.length - 1}
                      label="Descer"
                      onPress={() => void moveExercise(exercise.id, 'down')}
                      testID={`workout-plan-down-${exercise.id}`}
                    />
                    <WorkoutPlanAction
                      disabled={isMutating}
                      label="Excluir"
                      onPress={() => confirmDelete(exercise)}
                      testID={`workout-plan-delete-${exercise.id}`}
                      tone="danger"
                    />
                  </View>
                </Card>
              ))}
            </View>
          ))
        : null}

      {plans.isSuccess && plans.data.length > 0 ? (
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
  group: { gap: spacing.sm },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseCopy: { flex: 1, gap: spacing.xxs },
  exerciseName: { fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
