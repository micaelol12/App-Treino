import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { WorkoutFormField } from '@/features/workout-plans/presentation/components/workout-form-field';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { getWorkoutDivisionTemplateErrorMessage } from '../workout-division-template-error-message';
import {
  useImportWorkoutDivisionTemplate,
  useWorkoutDivisionTemplate,
} from '../workout-division-template-hooks';

export function WorkoutDivisionTemplateDetailsScreen({
  templateId,
}: {
  templateId: string;
}) {
  const router = useRouter();
  const theme = useAppTheme();
  const template = useWorkoutDivisionTemplate(templateId);
  const importTemplate = useImportWorkoutDivisionTemplate();
  const [customName, setCustomName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const name = customName ?? template.data?.name ?? '';

  const importDivision = async () => {
    setFeedback(null);
    try {
      const divisionId = await importTemplate.mutateAsync({ templateId, name });
      router.replace({
        pathname: '/configuracoes/divisao/[divisionId]',
        params: { divisionId },
      });
    } catch (error) {
      setFeedback(getWorkoutDivisionTemplateErrorMessage(error));
    }
  };

  if (template.isLoading) {
    return (
      <Screen title="Divisão pronta">
        <AppText>Carregando detalhes…</AppText>
      </Screen>
    );
  }
  if (template.isError || !template.data) {
    return (
      <Screen
        title="Divisão pronta"
        action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
      >
        <EmptyState
          title="Divisão indisponível"
          description={getWorkoutDivisionTemplateErrorMessage(template.error)}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={template.data.name}
      description={
        template.data.description || 'Confira os exercícios antes de adicionar.'
      }
      action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
      onRefresh={() => template.refetch()}
      refreshing={template.isRefetching}
    >
      <Card>
        <View style={styles.metadata}>
          {template.data.level ? <AppText>Nível: {template.data.level}</AppText> : null}
          {template.data.goal ? <AppText>Objetivo: {template.data.goal}</AppText> : null}
        </View>
      </Card>
      <View style={styles.list}>
        {template.data.exercises.map((exercise, index) => (
          <Card key={exercise.exerciseDocumentId}>
            <View style={styles.exerciseRow}>
              <AppText style={[styles.order, { color: theme.colors.primary }]}>
                {index + 1}
              </AppText>
              <View style={styles.exerciseCopy}>
                <AppText style={styles.exerciseName}>
                  {exercise.exerciseNameSnapshot}
                </AppText>
                <AppText style={{ color: theme.colors.textMuted }}>
                  {exercise.defaultSets} séries
                </AppText>
              </View>
            </View>
          </Card>
        ))}
      </View>
      <Card>
        <View style={styles.importBox}>
          <WorkoutFormField
            autoCapitalize="words"
            label="Nome no seu plano"
            value={name}
            onChangeText={setCustomName}
            maxLength={80}
            testID="division-template-name"
          />
          {feedback ? (
            <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {feedback}
            </AppText>
          ) : null}
          <PrimaryButton
            disabled={importTemplate.isPending}
            label={importTemplate.isPending ? 'Adicionando…' : 'Adicionar ao meu plano'}
            onPress={() => void importDivision()}
            testID="division-template-import"
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metadata: { gap: spacing.xxs },
  list: { gap: spacing.sm },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  order: { minWidth: 24, fontWeight: '800' },
  exerciseCopy: { flex: 1, gap: spacing.xxs },
  exerciseName: { fontWeight: '700' },
  importBox: { gap: spacing.sm },
});
