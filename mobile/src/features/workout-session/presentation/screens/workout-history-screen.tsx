import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { DatePickerField } from '@/shared/components/date-picker-field';
import { EmptyState } from '@/shared/components/empty-state';
import { InfoModal } from '@/shared/components/info-modal';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';
import { formatCivilDate } from '@/shared/validation/civil-date';

import {
  createWorkoutHistoryEditDraft,
  groupWorkoutHistory,
  type WorkoutHistoryEditDraft,
  type WorkoutHistorySession,
} from '../../domain/workout-history';
import { WorkoutSetEditor } from '../components/workout-set-editor';
import { getWorkoutSessionErrorMessage } from '../workout-session-error-message';
import { useWorkoutHistory, useWorkoutHistoryActions } from '../workout-session-hooks';

function exerciseGroups(session: WorkoutHistorySession) {
  const groups = new Map<string, typeof session.records>();
  for (const record of session.records) {
    groups.set(record.exerciseName, [...(groups.get(record.exerciseName) ?? []), record]);
  }
  return [...groups.entries()];
}

export function WorkoutHistoryScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const history = useWorkoutHistory();
  const { remove, update } = useWorkoutHistoryActions();
  const [editing, setEditing] = useState<WorkoutHistoryEditDraft | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const records = useMemo(
    () => history.data?.pages.flatMap((page) => page.records) ?? [],
    [history.data],
  );
  const sessions = useMemo(() => groupWorkoutHistory(records), [records]);

  const changeSet = (
    id: string,
    patch: Partial<WorkoutHistoryEditDraft['sets'][number]>,
  ) => {
    setEditing((current) =>
      current
        ? {
            ...current,
            sets: current.sets.map((set) => (set.id === id ? { ...set, ...patch } : set)),
          }
        : current,
    );
  };

  const save = async () => {
    if (!editing || update.isPending) return;
    setFeedback(null);
    try {
      await update.mutateAsync(editing);
      setEditing(null);
    } catch (error) {
      setFeedback(getWorkoutSessionErrorMessage(error));
    }
  };

  const confirmDelete = (session: WorkoutHistorySession) => {
    Alert.alert(
      'Excluir treino do histórico?',
      `${formatCivilDate(session.performedOn)} · ${session.workoutName}. Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir treino',
          style: 'destructive',
          onPress: () => {
            void remove
              .mutateAsync(session.records.map((record) => record.id))
              .catch((error) => {
                Alert.alert(
                  'Não foi possível excluir',
                  getWorkoutSessionErrorMessage(error),
                );
              });
          },
        },
      ],
    );
  };

  return (
    <Screen
      action={
        <SecondaryButton label="Novo registro" onPress={() => router.push('/registro')} />
      }
      description="Consulte, corrija ou exclua seus treinos concluídos."
      title="Histórico"
    >
      {history.isLoading ? (
        <Card>
          <AppText>Carregando treinos…</AppText>
        </Card>
      ) : null}
      {history.isError ? (
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {getWorkoutSessionErrorMessage(history.error)}
          </AppText>
          <PrimaryButton
            label="Tentar novamente"
            onPress={() => void history.refetch()}
          />
        </Card>
      ) : null}
      {history.isSuccess && sessions.length === 0 ? (
        <EmptyState
          description="Conclua um treino ou adicione um registro manual."
          title="Nenhum treino registrado"
        />
      ) : null}
      {sessions.map((session) => (
        <Card key={session.id}>
          <View style={styles.sessionHeader}>
            <View style={styles.grow}>
              <AppText variant="heading">{session.workoutName}</AppText>
              <AppText style={{ color: theme.colors.textMuted }}>
                {formatCivilDate(session.performedOn)} · {session.records.length}{' '}
                {session.records.length === 1 ? 'série' : 'séries'}
              </AppText>
            </View>
          </View>
          {exerciseGroups(session).map(([exerciseName, exerciseRecords]) => (
            <View key={exerciseName} style={styles.exercise}>
              <AppText style={styles.exerciseName}>{exerciseName}</AppText>
              {exerciseRecords.map((record) => (
                <View key={record.id} style={styles.recordRow}>
                  <AppText>Série {record.setNumber}</AppText>
                  <AppText style={styles.recordValue}>
                    {record.loadKg.toFixed(1)} kg × {record.repetitions} · RPE{' '}
                    {record.rpe}
                  </AppText>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.actions}>
            <SecondaryButton
              disabled={remove.isPending}
              label="Excluir"
              onPress={() => confirmDelete(session)}
              style={styles.action}
              tone="danger"
            />
            <PrimaryButton
              disabled={remove.isPending}
              label="Editar"
              onPress={() => {
                setFeedback(null);
                setEditing(createWorkoutHistoryEditDraft(session));
              }}
              style={styles.action}
            />
          </View>
        </Card>
      ))}
      {history.hasNextPage ? (
        <SecondaryButton
          disabled={history.isFetchingNextPage}
          label={history.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          onPress={() => void history.fetchNextPage()}
        />
      ) : null}

      <InfoModal
        onClose={() => {
          if (!update.isPending) setEditing(null);
        }}
        title="Editar treino"
        visible={Boolean(editing)}
      >
        {editing ? (
          <>
            <DatePickerField
              disabled={update.isPending}
              label="Data"
              onChange={(performedOn) => setEditing({ ...editing, performedOn })}
              value={editing.performedOn}
            />
            <View style={styles.field}>
              <AppText style={styles.label}>Divisão</AppText>
              <TextInput
                accessibilityLabel="Divisão do treino"
                editable={!update.isPending}
                maxLength={80}
                onChangeText={(workoutName) => setEditing({ ...editing, workoutName })}
                returnKeyType="done"
                style={[
                  styles.input,
                  { borderColor: theme.colors.border, color: theme.colors.text },
                ]}
                value={editing.workoutName}
              />
            </View>
            {editing.sets.map((set) => (
              <WorkoutSetEditor
                exerciseName={set.exerciseName}
                key={set.id}
                onChange={(patch) => changeSet(set.id, patch)}
                testIDPrefix={`history-${set.id}`}
                workoutSet={set}
              />
            ))}
            {feedback ? (
              <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
                {feedback}
              </AppText>
            ) : null}
            <PrimaryButton
              disabled={update.isPending}
              label={update.isPending ? 'Salvando…' : 'Salvar alterações'}
              onPress={() => void save()}
            />
          </>
        ) : null}
      </InfoModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  sessionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  exercise: { gap: spacing.xxs },
  exerciseName: { fontWeight: '700' },
  recordRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recordValue: { fontWeight: '700', textAlign: 'right' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  field: { gap: spacing.xs },
  label: { fontWeight: '700' },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 16,
  },
});
