import { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { DatePickerField } from '@/shared/components/date-picker-field';
import { EmptyState } from '@/shared/components/empty-state';
import { MetricChart } from '@/shared/components/metric-chart';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';
import { currentCivilDate, formatCivilDate } from '@/shared/validation/civil-date';

import { calculateWeightTrend } from '../../domain/weight-rules';
import { getWeightErrorMessage } from '../weight-error-message';
import { useWeightActions, useWeightHistory, useWeightUpsert } from '../weight-hooks';

function shortDate(value: string): string {
  return `${value.slice(8, 10)}/${value.slice(5, 7)}`;
}

export function WeightScreen() {
  const theme = useAppTheme();
  const history = useWeightHistory();
  const upsert = useWeightUpsert();
  const { remove, replace } = useWeightActions();
  const [recordedOn, setRecordedOn] = useState(currentCivilDate);
  const [weightText, setWeightText] = useState('75,0');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    readonly id: string;
    readonly originalDate: string;
  } | null>(null);
  const entries = useMemo(
    () => history.data?.pages.flatMap((page) => page.entries) ?? [],
    [history.data],
  );
  const trend = useMemo(() => calculateWeightTrend(entries), [entries]);
  const newestFirst = useMemo(() => [...trend].reverse(), [trend]);

  const persist = async () => {
    setFeedback(null);
    setFormError(null);
    try {
      const draft = {
        recordedOn,
        weightKg: Number(weightText.trim().replace(',', '.')),
      };
      if (editing) {
        await replace.mutateAsync({ draft, originalDocumentId: editing.id });
        setEditing(null);
        setFeedback('Pesagem atualizada.');
      } else {
        await upsert.mutateAsync(draft);
        setFeedback('Pesagem salva. Um registro anterior desta data foi atualizado.');
      }
    } catch (error) {
      setFormError(getWeightErrorMessage(error));
    }
  };

  const save = () => {
    const replacesAnotherDate =
      editing &&
      recordedOn !== editing.originalDate &&
      entries.some((entry) => entry.recordedOn === recordedOn && entry.id !== editing.id);
    if (!replacesAnotherDate) {
      void persist();
      return;
    }
    Alert.alert(
      'Substituir pesagem existente?',
      'Já existe uma pesagem nesta data. Ela será substituída pelo valor editado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Substituir', onPress: () => void persist() },
      ],
    );
  };

  const busy = upsert.isPending || replace.isPending;

  return (
    <Screen
      title="Peso"
      description="Registre uma pesagem por data e acompanhe a tendência de sete registros."
      onRefresh={() => history.refetch()}
      refreshing={history.isRefetching}
      scrollToTopSignal={editing?.id ?? null}
    >
      <Card>
        <AppText variant="heading">Nova pesagem</AppText>
        <View style={styles.fields}>
          <DatePickerField
            label="Data"
            onChange={setRecordedOn}
            testID="weight-date-input"
            value={recordedOn}
          />
          <View style={styles.field}>
            <AppText style={styles.label}>Peso (kg)</AppText>
            <TextInput
              accessibilityLabel="Peso em quilogramas"
              keyboardType="decimal-pad"
              onChangeText={setWeightText}
              onSubmitEditing={save}
              placeholder="75,0"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="done"
              style={[
                styles.input,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              testID="weight-value-input"
              value={weightText}
            />
          </View>
        </View>
        {formError ? (
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {formError}
          </AppText>
        ) : null}
        {feedback ? (
          <AppText
            accessibilityLiveRegion="polite"
            style={{ color: theme.colors.success }}
          >
            {feedback}
          </AppText>
        ) : null}
        <PrimaryButton
          disabled={busy}
          label={busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar pesagem'}
          onPress={save}
          testID="weight-submit"
        />
        {editing ? (
          <SecondaryButton
            disabled={busy}
            label="Cancelar edição"
            onPress={() => {
              setEditing(null);
              setRecordedOn(currentCivilDate());
              setWeightText('75,0');
              setFormError(null);
            }}
          />
        ) : null}
      </Card>

      {history.isLoading ? (
        <Card>
          <AppText accessibilityLiveRegion="polite">Carregando pesagens…</AppText>
        </Card>
      ) : null}
      {history.isError ? (
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {getWeightErrorMessage(history.error)}
          </AppText>
          <PrimaryButton
            disabled={history.isFetching}
            label={history.isFetching ? 'Atualizando…' : 'Tentar novamente'}
            onPress={() => void history.refetch()}
          />
        </Card>
      ) : null}
      {history.isSuccess && trend.length === 0 ? (
        <EmptyState
          title="Nenhuma pesagem ainda"
          description="Salve sua primeira pesagem para iniciar o gráfico."
        />
      ) : null}
      {trend.length > 0 ? (
        <Card>
          <AppText variant="heading">Peso e tendência</AppText>
          <AppText style={{ color: theme.colors.textMuted }}>
            A tendência considera os últimos sete registros, mesmo quando existem dias sem
            pesagem.
          </AppText>
          <MetricChart
            accessibilitySummary={`Gráfico com ${trend.length} pesagens. A mais recente é ${trend.at(-1)?.weightKg.toFixed(1)} quilogramas e a tendência é ${trend.at(-1)?.sevenEntryAverageKg.toFixed(1)} quilogramas.`}
            series={[
              {
                name: 'Peso',
                color: theme.colors.primary,
                points: trend.map((point) => ({
                  label: shortDate(point.recordedOn),
                  value: point.weightKg,
                })),
              },
              {
                name: 'Média de 7 registros',
                color: theme.colors.success,
                points: trend.map((point) => ({
                  label: shortDate(point.recordedOn),
                  value: point.sevenEntryAverageKg,
                })),
              },
            ]}
          />
        </Card>
      ) : null}

      {newestFirst.length > 0 ? (
        <Card>
          <AppText variant="heading">Histórico</AppText>
          {newestFirst.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <View style={styles.historyRow}>
                <AppText>{formatCivilDate(entry.recordedOn)}</AppText>
                <AppText style={styles.historyValue}>
                  {entry.weightKg.toFixed(1)} kg
                </AppText>
              </View>
              <View style={styles.historyActions}>
                <SecondaryButton
                  disabled={remove.isPending}
                  label="Excluir"
                  onPress={() => {
                    Alert.alert(
                      'Excluir pesagem?',
                      `${entry.recordedOn} · ${entry.weightKg.toFixed(1)} kg. Esta ação não pode ser desfeita.`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Excluir',
                          style: 'destructive',
                          onPress: () =>
                            void remove.mutateAsync(entry.id).catch((error) => {
                              Alert.alert(
                                'Não foi possível excluir',
                                getWeightErrorMessage(error),
                              );
                            }),
                        },
                      ],
                    );
                  }}
                  style={styles.historyAction}
                  tone="danger"
                />
                <SecondaryButton
                  disabled={remove.isPending}
                  label="Editar"
                  onPress={() => {
                    setEditing({ id: entry.id, originalDate: entry.recordedOn });
                    setRecordedOn(entry.recordedOn);
                    setWeightText(entry.weightKg.toFixed(1).replace('.', ','));
                    setFeedback(null);
                    setFormError(null);
                  }}
                  style={styles.historyAction}
                />
              </View>
            </View>
          ))}
          {history.hasNextPage ? (
            <SecondaryButton
              disabled={history.isFetchingNextPage}
              label={history.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
              onPress={() => void history.fetchNextPage()}
            />
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { flex: 1, minWidth: 140, gap: spacing.xs },
  label: { fontWeight: '700' },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 16,
  },
  historyRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyItem: { gap: spacing.xs },
  historyActions: { flexDirection: 'row', gap: spacing.xs },
  historyAction: { minHeight: 40, flex: 1 },
  historyValue: { fontWeight: '700' },
});
