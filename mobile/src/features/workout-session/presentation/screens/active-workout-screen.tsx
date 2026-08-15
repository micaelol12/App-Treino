import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/presentation/auth-context';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { useActiveWorkoutStore } from '../active-workout.store';
import { WorkoutSetEditor } from '../components/workout-set-editor';
import { getWorkoutSessionErrorMessage } from '../workout-session-error-message';
import { useCompleteWorkoutSession } from '../workout-session-hooks';

export function ActiveWorkoutScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { session } = useAuth();
  const draft = useActiveWorkoutStore((state) => state.draft);
  const hasHydrated = useActiveWorkoutStore((state) => state.hasHydrated);
  const storedExerciseIndex = useActiveWorkoutStore(
    (state) => state.currentExerciseIndex,
  );
  const updateSet = useActiveWorkoutStore((state) => state.updateSet);
  const previousExercise = useActiveWorkoutStore((state) => state.previousExercise);
  const nextExercise = useActiveWorkoutStore((state) => state.nextExercise);
  const clear = useActiveWorkoutStore((state) => state.clear);
  const complete = useCompleteWorkoutSession();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!hasHydrated) {
    return (
      <Screen title="Treino em andamento">
        <Card>
          <AppText accessibilityLiveRegion="polite">Restaurando treino…</AppText>
        </Card>
      </Screen>
    );
  }

  if (!draft || draft.userId !== session?.uid || !draft.exercises.length) {
    return (
      <Screen title="Treino em andamento">
        <EmptyState
          title="Nenhum treino em andamento"
          description="Inicie uma sessão pela aba Treino."
        />
        <PrimaryButton
          label="Voltar para Treino"
          onPress={() => router.replace('/treino')}
        />
      </Screen>
    );
  }

  const exerciseIndex = Math.min(storedExerciseIndex, draft.exercises.length - 1);
  const exercise = draft.exercises[exerciseIndex];
  if (!exercise) {
    return (
      <Screen title="Treino em andamento">
        <EmptyState
          title="Rascunho incompatível"
          description="Volte à aba Treino e inicie uma nova sessão."
        />
        <PrimaryButton
          label="Voltar para Treino"
          onPress={() => router.replace('/treino')}
        />
      </Screen>
    );
  }
  const isFirst = exerciseIndex === 0;
  const isLast = exerciseIndex === draft.exercises.length - 1;

  const abort = () => {
    Alert.alert(
      'Abortar treino?',
      'Todos os valores preenchidos neste treino serão apagados.',
      [
        { text: 'Continuar treinando', style: 'cancel' },
        {
          text: 'Abortar e apagar',
          style: 'destructive',
          onPress: () => {
            clear();
            router.replace('/treino');
          },
        },
      ],
    );
  };

  const finish = async () => {
    if (complete.isPending) return;
    setFeedback(null);
    try {
      const setCount = await complete.mutateAsync(draft);
      clear();
      Alert.alert(
        'Treino concluído',
        `${setCount} ${setCount === 1 ? 'série foi salva' : 'séries foram salvas'}.`,
        [{ text: 'OK', onPress: () => router.replace('/treino') }],
      );
    } catch (error) {
      setFeedback(getWorkoutSessionErrorMessage(error));
    }
  };

  return (
    <Screen
      title={draft.division}
      description={`${draft.performedOn} · exercício ${exerciseIndex + 1} de ${draft.exercises.length}`}
      action={<SecondaryButton label="Abortar" onPress={abort} tone="danger" />}
    >
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 1,
          max: draft.exercises.length,
          now: exerciseIndex + 1,
        }}
      >
        <AppText variant="heading">{exercise.name}</AppText>
      </View>

      <View style={styles.sets}>
        {exercise.sets.map((workoutSet, setIndex) => (
          <WorkoutSetEditor
            exerciseName={exercise.name}
            key={workoutSet.setNumber}
            onChange={(patch) => updateSet(exerciseIndex, setIndex, patch)}
            workoutSet={workoutSet}
          />
        ))}
      </View>

      {feedback ? (
        <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {feedback}
        </AppText>
      ) : null}

      <View style={styles.navigation}>
        <SecondaryButton
          disabled={isFirst || complete.isPending}
          label="Anterior"
          onPress={previousExercise}
          style={styles.navigationButton}
        />
        {!isLast ? (
          <PrimaryButton
            disabled={complete.isPending}
            label="Próximo"
            onPress={nextExercise}
            style={styles.navigationButton}
          />
        ) : (
          <PrimaryButton
            disabled={complete.isPending}
            label={complete.isPending ? 'Salvando…' : 'Concluir treino'}
            onPress={() => void finish()}
            style={styles.navigationButton}
            testID="complete-workout"
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sets: { gap: spacing.sm },
  navigation: { flexDirection: 'row', gap: spacing.sm },
  navigationButton: { flex: 1 },
});
