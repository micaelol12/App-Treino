import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { getWorkoutDivisionTemplateErrorMessage } from '../workout-division-template-error-message';
import { useWorkoutDivisionTemplates } from '../workout-division-template-hooks';

export function WorkoutDivisionTemplatesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const templates = useWorkoutDivisionTemplates();

  return (
    <Screen
      title="Divisões prontas"
      description="Escolha uma base criada pela equipe e personalize depois."
      action={<SecondaryButton label="Voltar" onPress={() => router.back()} />}
      onRefresh={() => templates.refetch()}
      refreshing={templates.isRefetching}
    >
      {templates.isLoading ? <AppText>Carregando divisões…</AppText> : null}
      {templates.isError ? (
        <Card>
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {getWorkoutDivisionTemplateErrorMessage(templates.error)}
          </AppText>
          <PrimaryButton
            label="Tentar novamente"
            onPress={() => void templates.refetch()}
          />
        </Card>
      ) : null}
      {templates.isSuccess && templates.data.length === 0 ? (
        <EmptyState
          title="Nenhuma divisão disponível"
          description="A equipe ainda não publicou divisões prontas."
        />
      ) : null}
      <View style={styles.list}>
        {templates.data?.map((template) => (
          <Card key={template.id}>
            <View style={styles.copy}>
              <AppText variant="heading">{template.name}</AppText>
              {template.description ? <AppText>{template.description}</AppText> : null}
              <AppText style={{ color: theme.colors.textMuted }}>
                {template.exerciseCount} exercício
                {template.exerciseCount === 1 ? '' : 's'}
                {template.level ? ` · ${template.level}` : ''}
                {template.goal ? ` · ${template.goal}` : ''}
              </AppText>
            </View>
            <PrimaryButton
              label="Ver detalhes"
              onPress={() =>
                router.push({
                  pathname: '/configuracoes/divisao-pronta/[templateId]',
                  params: { templateId: template.id },
                })
              }
              testID={`division-template-${template.id}`}
            />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  copy: { gap: spacing.xxs },
});
