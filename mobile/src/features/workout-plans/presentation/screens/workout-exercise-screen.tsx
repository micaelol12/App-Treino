import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
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
  division: '',
  name: '',
  defaultSets: '3',
  order: '1',
};

export function WorkoutExerciseScreen({ exerciseId }: { exerciseId: string }) {
  const router = useRouter();
  const theme = useAppTheme();
  const isCreating = exerciseId === 'novo';
  const plans = useWorkoutPlanExercises();
  const { create, update } = useWorkoutPlanActions();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const exercise = plans.data?.find(({ id }) => id === exerciseId);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
  } = useForm<WorkoutExerciseFormValues>({
    resolver: zodResolver(workoutExerciseFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (exercise) {
      reset({
        division: exercise.division,
        name: exercise.name,
        defaultSets: String(exercise.defaultSets),
        order: String(exercise.order),
      });
    }
  }, [exercise, reset]);

  const submit = handleSubmit(async (values) => {
    setSubmissionError(null);
    const draft = {
      division: values.division,
      name: values.name,
      defaultSets: Number(values.defaultSets),
      order: Number(values.order),
    };

    try {
      if (isCreating) {
        await create.mutateAsync(draft);
      } else {
        await update.mutateAsync({ draft, exerciseId });
      }
      router.back();
    } catch (error) {
      setSubmissionError(getWorkoutPlanErrorMessage(error));
    }
  });

  if (!isCreating && plans.isLoading) {
    return (
      <Screen title="Editar exercício">
        <Card>
          <AppText>Carregando exercício…</AppText>
        </Card>
      </Screen>
    );
  }

  if (!isCreating && plans.isError) {
    return (
      <Screen title="Editar exercício">
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {getWorkoutPlanErrorMessage(plans.error)}
          </AppText>
          <PrimaryButton label="Tentar novamente" onPress={() => void plans.refetch()} />
        </Card>
      </Screen>
    );
  }

  if (!isCreating && plans.isSuccess && !exercise) {
    return (
      <Screen title="Editar exercício">
        <EmptyState
          title="Exercício não encontrado"
          description="Ele pode ter sido removido em outro dispositivo."
        />
        <PrimaryButton label="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      title={isCreating ? 'Adicionar exercício' : 'Editar exercício'}
      description="Os dados são salvos no mesmo formato aceito pelo aplicativo legado."
    >
      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="division"
            render={({ field, fieldState }) => (
              <WorkoutFormField
                autoCapitalize="words"
                error={fieldState.error?.message}
                label="Divisão"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Ex.: Push"
                testID="workout-division-input"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <WorkoutFormField
                autoCapitalize="words"
                error={fieldState.error?.message}
                label="Exercício"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Ex.: Supino reto"
                testID="workout-name-input"
                value={field.value}
              />
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

const styles = StyleSheet.create({ form: { gap: spacing.md } });
