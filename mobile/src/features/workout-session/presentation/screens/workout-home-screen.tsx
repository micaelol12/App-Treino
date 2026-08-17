import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { createWorkoutSessionId } from '../../application/create-workout-session-id';
import { createWorkoutSessionDraft } from '../../domain/workout-session-rules';
import { useAuth } from '@/features/auth/presentation/auth-context';
import { getWorkoutPlanErrorMessage } from '@/features/workout-plans/presentation/workout-plan-error-message';
import { useWorkoutPlanExercises } from '@/features/workout-plans/presentation/workout-plan-hooks';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { useActiveWorkoutStore } from '../active-workout.store';
import { getWorkoutSessionErrorMessage } from '../workout-session-error-message';

function currentCivilDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function WorkoutHomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { session } = useAuth();
  const plans = useWorkoutPlanExercises();
  const draft = useActiveWorkoutStore((state) => state.draft);
  const hasHydrated = useActiveWorkoutStore((state) => state.hasHydrated);
  const start = useActiveWorkoutStore((state) => state.start);
  const clear = useActiveWorkoutStore((state) => state.clear);
  const [performedOn, setPerformedOn] = useState(currentCivilDate);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const divisions = useMemo(
    () => [...new Set((plans.data ?? []).map((exercise) => exercise.division))],
    [plans.data],
  );
  const effectiveDivision = selectedDivision || divisions[0] || '';

  useEffect(() => {
    if (hasHydrated && draft && session && draft.userId !== session.uid) clear();
  }, [clear, draft, hasHydrated, session]);

  const beginWorkout = () => {
    if (!session || !plans.data) return;
    setValidationError(null);
    try {
      start(
        createWorkoutSessionDraft({
          sessionId: createWorkoutSessionId(),
          userId: session.uid,
          performedOn,
          division: effectiveDivision,
          exercises: plans.data,
        }),
      );
      router.push('/treino/ativo');
    } catch (error) {
      setValidationError(getWorkoutSessionErrorMessage(error));
    }
  };

  const discardDraft = () => {
    Alert.alert(
      'Descartar treino em andamento?',
      'Todos os valores preenchidos neste treino serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: clear },
      ],
    );
  };

  if (!hasHydrated) {
    return (
      <Screen title="Seu treino" description="Plano atual e próxima sessão.">
        <Card>
          <AppText accessibilityLiveRegion="polite">Restaurando treino…</AppText>
        </Card>
      </Screen>
    );
  }

  if (draft && draft.userId === session?.uid) {
    return (
      <Screen title="Seu treino" description="Há um rascunho salvo neste aparelho.">
        <Card>
          <AppText variant="heading">{draft.division}</AppText>
          <AppText>
            {draft.performedOn} · {draft.exercises.length} exercícios
          </AppText>
          <PrimaryButton
            label="Continuar treino"
            onPress={() => router.push('/treino/ativo')}
          />
          <SecondaryButton
            label="Descartar rascunho"
            onPress={discardDraft}
            tone="danger"
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Seu treino" description="Escolha a data e a divisão para começar.">
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
          />
        </Card>
      ) : null}

      {plans.isSuccess && plans.data.length === 0 ? (
        <EmptyState
          title="Configure seu plano primeiro"
          description="Adicione exercícios na aba Ajustes antes de iniciar um treino."
        />
      ) : null}

      {plans.isSuccess && plans.data.length > 0 ? (
        <Card>
          <View style={styles.field}>
            <AppText style={styles.label}>Data</AppText>
            <TextInput
              accessibilityLabel="Data do treino no formato AAAA-MM-DD"
              autoCapitalize="none"
              onChangeText={setPerformedOn}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              testID="workout-date-input"
              value={performedOn}
            />
          </View>
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
          {validationError ? (
            <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {validationError}
            </AppText>
          ) : null}
          <PrimaryButton label="Iniciar treino" onPress={beginWorkout} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontWeight: '700' },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 16,
  },
  divisions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  division: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
