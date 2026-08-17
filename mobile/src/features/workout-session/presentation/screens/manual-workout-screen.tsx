import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { createWorkoutSessionId } from '../../application/create-workout-session-id';
import type {
  WorkoutSessionDraft,
  WorkoutSetDraft,
} from '../../domain/workout-session-draft';
import { createWorkoutSessionDraft } from '../../domain/workout-session-rules';
import { useAuth } from '@/features/auth/presentation/auth-context';
import { getWorkoutPlanErrorMessage } from '@/features/workout-plans/presentation/workout-plan-error-message';
import { useWorkoutPlanExercises } from '@/features/workout-plans/presentation/workout-plan-hooks';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { DatePickerField } from '@/shared/components/date-picker-field';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';
import { currentCivilDate } from '@/shared/validation/civil-date';

import { WorkoutSetEditor } from '../components/workout-set-editor';
import { ExerciseHistoryButton } from '../components/exercise-history-button';
import { getWorkoutSessionErrorMessage } from '../workout-session-error-message';
import { useCompleteWorkoutSession } from '../workout-session-hooks';

type WorkoutSetPatch = Partial<
  Pick<WorkoutSetDraft, 'loadKg' | 'repetitions' | 'rpe' | 'note'>
>;

export function ManualWorkoutScreen() {
  const theme = useAppTheme();
  const { session } = useAuth();
  const plans = useWorkoutPlanExercises();
  const complete = useCompleteWorkoutSession();
  const submitting = useRef(false);
  const [performedOn, setPerformedOn] = useState(currentCivilDate);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [draft, setDraft] = useState<WorkoutSessionDraft | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const divisions = [...new Set((plans.data ?? []).map((exercise) => exercise.division))];
  const effectiveDivision = selectedDivision || divisions[0] || '';

  const prepareForm = () => {
    if (!session || !plans.data) return;
    setFeedback(null);

    try {
      setDraft(
        createWorkoutSessionDraft({
          sessionId: createWorkoutSessionId(),
          userId: session.uid,
          performedOn,
          division: effectiveDivision,
          exercises: plans.data,
        }),
      );
    } catch (error) {
      setFeedback(getWorkoutSessionErrorMessage(error));
    }
  };

  const updateSet = (exerciseIndex: number, setIndex: number, patch: WorkoutSetPatch) => {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;

      return {
        ...currentDraft,
        exercises: currentDraft.exercises.map((exercise, exercisePosition) =>
          exercisePosition !== exerciseIndex
            ? exercise
            : {
                ...exercise,
                sets: exercise.sets.map((workoutSet, setPosition) =>
                  setPosition === setIndex ? { ...workoutSet, ...patch } : workoutSet,
                ),
              },
        ),
      };
    });
  };

  const resetForm = () => {
    Alert.alert(
      'Alterar data ou divisão?',
      'Os valores preenchidos neste formulário serão apagados.',
      [
        { text: 'Continuar preenchendo', style: 'cancel' },
        {
          text: 'Apagar formulário',
          style: 'destructive',
          onPress: () => {
            setDraft(null);
            setFeedback(null);
          },
        },
      ],
    );
  };

  const submit = async () => {
    if (!draft || submitting.current || complete.isPending) return;

    submitting.current = true;
    setFeedback(null);
    try {
      const setCount = await complete.mutateAsync(draft);
      setDraft(null);
      Alert.alert(
        'Registro salvo',
        `${setCount} ${setCount === 1 ? 'série foi salva' : 'séries foram salvas'}.`,
      );
    } catch (error) {
      setFeedback(getWorkoutSessionErrorMessage(error));
    } finally {
      submitting.current = false;
    }
  };

  if (draft && draft.userId === session?.uid) {
    return (
      <Screen
        title="Registro manual"
        description={`${draft.performedOn} · ${draft.division}`}
        action={
          <SecondaryButton
            disabled={complete.isPending}
            label="Alterar"
            onPress={resetForm}
          />
        }
      >
        {draft.exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.planExerciseId} style={styles.exercise}>
            <View style={styles.exerciseHeader}>
              <AppText style={styles.exerciseTitle} variant="heading">
                {exercise.name}
              </AppText>
              <ExerciseHistoryButton exerciseName={exercise.name} />
            </View>
            {exercise.sets.map((workoutSet, setIndex) => (
              <WorkoutSetEditor
                exerciseName={exercise.name}
                key={workoutSet.setNumber}
                onChange={(patch) => updateSet(exerciseIndex, setIndex, patch)}
                testIDPrefix={`manual-${exercise.planExerciseId}-set`}
                workoutSet={workoutSet}
              />
            ))}
          </View>
        ))}

        {feedback ? (
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {feedback}
          </AppText>
        ) : null}

        <PrimaryButton
          disabled={complete.isPending}
          label={complete.isPending ? 'Salvando…' : 'Salvar registro'}
          onPress={() => void submit()}
          testID="manual-workout-submit"
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Registro manual"
      description="Preencha todas as séries de uma divisão em um único formulário."
    >
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
            disabled={plans.isFetching}
            label={plans.isFetching ? 'Atualizando…' : 'Tentar novamente'}
            onPress={() => void plans.refetch()}
            testID="manual-workout-retry"
          />
        </Card>
      ) : null}

      {plans.isSuccess && plans.data.length === 0 ? (
        <EmptyState
          title="Configure seu plano primeiro"
          description="Adicione exercícios na aba Ajustes antes de fazer um registro."
        />
      ) : null}

      {plans.isSuccess && plans.data.length > 0 ? (
        <Card>
          <DatePickerField
            label="Data"
            onChange={setPerformedOn}
            testID="manual-workout-date-input"
            value={performedOn}
          />
          <View style={styles.field}>
            <AppText style={styles.label}>Divisão</AppText>
            <View accessibilityRole="radiogroup" style={styles.divisions}>
              {divisions.map((division) => {
                const selected = division === effectiveDivision;
                return (
                  <Pressable
                    accessibilityLabel={division}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={division}
                    onPress={() => setSelectedDivision(division)}
                    style={[
                      styles.division,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.surfaceMuted,
                      },
                    ]}
                    testID={`manual-workout-division-${division}`}
                  >
                    <AppText
                      style={{
                        color: selected ? theme.colors.onPrimary : theme.colors.text,
                      }}
                    >
                      {division}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {feedback ? (
            <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {feedback}
            </AppText>
          ) : null}
          <PrimaryButton
            label="Preencher registro"
            onPress={prepareForm}
            testID="manual-workout-prepare"
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  exercise: { gap: spacing.sm },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseTitle: { flex: 1 },
  field: { gap: spacing.xs },
  label: { fontWeight: '700' },
  divisions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  division: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
