import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { MetricChart } from '@/shared/components/metric-chart';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { calculateWeightTrend } from '../../domain/weight-rules';
import { getWeightErrorMessage } from '../weight-error-message';
import { useWeightHistory, useWeightUpsert } from '../weight-hooks';

function currentCivilDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shortDate(value: string): string {
  return `${value.slice(8, 10)}/${value.slice(5, 7)}`;
}

export function WeightScreen() {
  const theme = useAppTheme();
  const history = useWeightHistory();
  const upsert = useWeightUpsert();
  const [recordedOn, setRecordedOn] = useState(currentCivilDate);
  const [weightText, setWeightText] = useState('75,0');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const entries = useMemo(
    () => history.data?.pages.flatMap((page) => page.entries) ?? [],
    [history.data],
  );
  const trend = useMemo(() => calculateWeightTrend(entries), [entries]);
  const newestFirst = useMemo(() => [...trend].reverse(), [trend]);

  const save = async () => {
    setFeedback(null);
    setFormError(null);
    try {
      await upsert.mutateAsync({
        recordedOn,
        weightKg: Number(weightText.trim().replace(',', '.')),
      });
      setFeedback('Pesagem salva. Um registro anterior desta data foi atualizado.');
    } catch (error) {
      setFormError(getWeightErrorMessage(error));
    }
  };

  return (
    <Screen
      title="Peso"
      description="Registre uma pesagem por data e acompanhe a tendência de sete registros."
    >
      <Card>
        <AppText variant="heading">Nova pesagem</AppText>
        <View style={styles.fields}>
          <View style={styles.field}>
            <AppText style={styles.label}>Data</AppText>
            <TextInput
              accessibilityLabel="Data da pesagem no formato AAAA-MM-DD"
              onChangeText={setRecordedOn}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              testID="weight-date-input"
              value={recordedOn}
            />
          </View>
          <View style={styles.field}>
            <AppText style={styles.label}>Peso (kg)</AppText>
            <TextInput
              accessibilityLabel="Peso em quilogramas"
              keyboardType="decimal-pad"
              onChangeText={setWeightText}
              placeholder="75,0"
              placeholderTextColor={theme.colors.textMuted}
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
          disabled={upsert.isPending}
          label={upsert.isPending ? 'Salvando…' : 'Salvar pesagem'}
          onPress={() => void save()}
          testID="weight-submit"
        />
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
            <View key={entry.recordedOn} style={styles.historyRow}>
              <AppText>{entry.recordedOn}</AppText>
              <AppText style={styles.historyValue}>
                {entry.weightKg.toFixed(1)} kg
              </AppText>
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
  historyValue: { fontWeight: '700' },
});
