import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useExerciseCatalog } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import { ExerciseCatalogSelect } from '@/features/exercise-catalog/presentation/components/exercise-catalog-select';
import { useWorkoutDivisions } from '@/features/workout-divisions/presentation/workout-division-hooks';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SearchableSelect } from '@/shared/components/searchable-select';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { WorkoutFormField } from '../components/workout-form-field';
import { WorkoutPlanAction } from '../components/workout-plan-action';
import { getWorkoutPlanErrorMessage } from '../workout-plan-error-message';
import {
  workoutExerciseFormSchema,
  type WorkoutExerciseFormValues,
} from '../workout-exercise-form.schema';
import { useWorkoutPlanActions, useWorkoutPlanExercises } from '../workout-plan-hooks';

const defaultValues: WorkoutExerciseFormValues = {
  divisionId: '',
  exerciseDocumentId: '',
  defaultSets: '3',
  order: '1',
};

export function WorkoutExerciseScreen({
  divisionId,
  exerciseId,
}: {
  divisionId?: string;
  exerciseId: string;
}) {
  const router = useRouter();
  const theme = useAppTheme();
  const isCreating = exerciseId === 'novo';
  const plans = useWorkoutPlanExercises();
  const divisions = useWorkoutDivisions();
  const catalog = useExerciseCatalog();
  const { create, update } = useWorkoutPlanActions();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const setsRef = useRef<TextInput>(null);
  const orderRef = useRef<TextInput>(null);
  const exercise = plans.data?.find(({ id }) => id === exerciseId);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
  } = useForm<WorkoutExerciseFormValues>({
    resolver: zodResolver(workoutExerciseFormSchema),
    defaultValues: { ...defaultValues, divisionId: divisionId ?? '' },
  });

  useEffect(() => {
    if (exercise?.exerciseDocumentId) {
      reset({
        divisionId: exercise.divisionId,
        exerciseDocumentId: exercise.exerciseDocumentId,
        defaultSets: String(exercise.defaultSets),
        order: String(exercise.order),
      });
    }
  }, [exercise, reset]);

  const activeDivisions = (divisions.data ?? []).filter(
    (division) => division.active || division.id === divisionId,
  );
  const contextualDivision = divisionId
    ? activeDivisions.find(({ id }) => id === divisionId)
    : undefined;
  const divisionOptions = activeDivisions.map((division) => ({
    value: division.id,
    label: division.name,
    description: `Ordem ${division.order}`,
  }));

  const submit = handleSubmit(async (values) => {
    setSubmissionError(null);
    const division = activeDivisions.find(({ id }) => id === values.divisionId);
    const catalogExercise = catalog.data?.find(
      ({ documentId }) => documentId === values.exerciseDocumentId,
    );
    if (!division || !catalogExercise) {
      setSubmissionError('Atualize os dados e selecione divisão e exercício novamente.');
      return;
    }
    const draft = {
      divisionId: division.id,
      divisionNameSnapshot: division.name,
      exerciseId: catalogExercise.id,
      exerciseDocumentId: catalogExercise.documentId,
      exerciseNameSnapshot: catalogExercise.name,
      defaultSets: Number(values.defaultSets),
      order: Number(values.order),
    };

    try {
      if (isCreating) await create.mutateAsync(draft);
      else await update.mutateAsync({ draft, exerciseId });
      router.back();
    } catch (error) {
      setSubmissionError(getWorkoutPlanErrorMessage(error));
    }
  });

  const loading = plans.isLoading || divisions.isLoading || catalog.isLoading;
  const loadError = plans.error ?? divisions.error ?? catalog.error;

  if (loading) {
    return (
      <Screen title={isCreating ? 'Adicionar exercício' : 'Editar exercício'}>
        <Card>
          <AppText>Carregando catálogo e divisões…</AppText>
        </Card>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen title={isCreating ? 'Adicionar exercício' : 'Editar exercício'}>
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            Não foi possível carregar o catálogo ou as divisões.
          </AppText>
          <PrimaryButton
            label="Tentar novamente"
            onPress={() =>
              void Promise.all([plans.refetch(), divisions.refetch(), catalog.refetch()])
            }
          />
        </Card>
      </Screen>
    );
  }

  if (
    !isCreating &&
    (!exercise ||
      exercise.sourceSchemaVersion !== 2 ||
      (divisionId && exercise.divisionId !== divisionId))
  ) {
    return (
      <Screen title="Editar exercício">
        <EmptyState
          title={exercise ? 'Item legado' : 'Exercício não encontrado'}
          description={
            exercise
              ? 'Migre este plano para o novo catálogo antes de editá-lo.'
              : 'Ele pode ter sido removido em outro dispositivo.'
          }
        />
        <PrimaryButton label="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (divisionId && !contextualDivision) {
    return (
      <Screen title={isCreating ? 'Adicionar exercício' : 'Editar exercício'}>
        <EmptyState
          title="Divisão não encontrada"
          description="Ela pode ter sido removida em outro dispositivo."
        />
        <PrimaryButton label="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!activeDivisions.length) {
    return (
      <Screen title="Adicionar exercício">
        <EmptyState
          title="Cadastre uma divisão primeiro"
          description="Volte ao plano de treino e crie ao menos uma divisão ativa."
        />
        <PrimaryButton label="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      title={isCreating ? 'Adicionar exercício' : 'Editar exercício'}
      description="Selecione somente exercícios cadastrados no catálogo."
    >
      <Card>
        <View style={styles.form}>
          {divisionId ? (
            <View style={styles.form}>
              <AppText style={styles.contextLabel}>Divisão</AppText>
              <AppText>{contextualDivision?.name}</AppText>
            </View>
          ) : (
            <Controller
              control={control}
              name="divisionId"
              render={({ field, fieldState }) => (
                <View style={styles.form}>
                  <SearchableSelect
                    label="Divisão"
                    onChange={field.onChange}
                    options={divisionOptions}
                    testID="workout-division-input"
                    value={field.value}
                  />
                  {fieldState.error ? (
                    <AppText style={{ color: theme.colors.danger }}>
                      {fieldState.error.message}
                    </AppText>
                  ) : null}
                </View>
              )}
            />
          )}
          <Controller
            control={control}
            name="exerciseDocumentId"
            render={({ field, fieldState }) => (
              <View style={styles.form}>
                <ExerciseCatalogSelect
                  exercises={catalog.data ?? []}
                  onChange={field.onChange}
                  testID="workout-name-input"
                  value={field.value}
                />
                {fieldState.error ? (
                  <AppText style={{ color: theme.colors.danger }}>
                    {fieldState.error.message}
                  </AppText>
                ) : null}
              </View>
            )}
          />
          <Controller
            control={control}
            name="defaultSets"
            render={({ field, fieldState }) => (
              <WorkoutFormField
                error={fieldState.error?.message}
                keyboardType="number-pad"
                label="Séries padrão"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                onSubmitEditing={() => orderRef.current?.focus()}
                ref={setsRef}
                returnKeyType="next"
                testID="workout-sets-input"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="order"
            render={({ field, fieldState }) => (
              <WorkoutFormField
                error={fieldState.error?.message}
                keyboardType="number-pad"
                label="Ordem"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                onSubmitEditing={() => void submit()}
                ref={orderRef}
                returnKeyType="done"
                testID="workout-order-input"
                value={field.value}
              />
            )}
          />
          {submissionError ? (
            <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {submissionError}
            </AppText>
          ) : null}
          <PrimaryButton
            disabled={isSubmitting}
            label={isSubmitting ? 'Salvando…' : 'Salvar exercício'}
            onPress={submit}
            testID="workout-save-button"
          />
          <WorkoutPlanAction
            disabled={isSubmitting}
            label="Cancelar"
            onPress={() => router.back()}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  contextLabel: { fontWeight: '700' },
});
