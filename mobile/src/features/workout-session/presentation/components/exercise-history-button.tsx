import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { InfoModal } from '@/shared/components/info-modal';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';
import { formatCivilDate } from '@/shared/validation/civil-date';

import { groupWorkoutHistory } from '../../domain/workout-history';
import { getWorkoutSessionErrorMessage } from '../workout-session-error-message';
import { useExerciseHistory } from '../workout-session-hooks';

export function ExerciseHistoryButton({ exerciseName }: { exerciseName: string }) {
  const router = useRouter();
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const history = useExerciseHistory(exerciseName, open);
  const sessions = groupWorkoutHistory(history.data ?? []).slice(0, 5);

  return (
    <>
      <Pressable
        accessibilityHint="Mostra as cargas e séries dos últimos treinos"
        accessibilityLabel={`Histórico de ${exerciseName}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.65 : 1 }]}
        testID={`exercise-history-${exerciseName}`}
      >
        <Ionicons color={theme.colors.primary} name="time-outline" size={25} />
      </Pressable>
      <InfoModal
        onClose={() => setOpen(false)}
        title={`Histórico · ${exerciseName}`}
        visible={open}
      >
        {history.isLoading ? <AppText>Carregando histórico…</AppText> : null}
        {history.isError ? (
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {getWorkoutSessionErrorMessage(history.error)}
          </AppText>
        ) : null}
        {history.isSuccess && sessions.length === 0 ? (
          <EmptyState
            description="Conclua um treino ou faça um registro manual."
            title="Nenhum registro deste exercício"
          />
        ) : null}
        {sessions.map((session) => (
          <Card key={session.id}>
            <AppText style={styles.sessionTitle}>
              {formatCivilDate(session.performedOn)} · {session.workoutName}
            </AppText>
            {session.records.map((record) => (
              <View key={record.id} style={styles.row}>
                <AppText>Série {record.setNumber}</AppText>
                <AppText style={styles.value}>
                  {record.loadKg.toFixed(1)} kg × {record.repetitions} · RPE {record.rpe}
                </AppText>
              </View>
            ))}
          </Card>
        ))}
        {sessions.length ? (
          <SecondaryButton
            label="Ver histórico completo"
            onPress={() => {
              setOpen(false);
              router.push('/historico' as Href);
            }}
          />
        ) : null}
      </InfoModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sessionTitle: { fontWeight: '700' },
  row: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: { fontWeight: '700', textAlign: 'right' },
});
