import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';

import {
  useExerciseCatalogSnapshot,
  useExerciseCatalogSynchronization,
} from '../exercise-catalog-hooks';

function formatSyncDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ExerciseCatalogSyncSection() {
  const theme = useAppTheme();
  const catalog = useExerciseCatalogSnapshot();
  const synchronization = useExerciseCatalogSynchronization();

  return (
    <Card>
      <AppText variant="heading">Catálogo de exercícios</AppText>
      {catalog.data ? (
        <>
          <AppText>
            {catalog.data.exercises.length} exercícios disponíveis offline.
          </AppText>
          <AppText style={{ color: theme.colors.textMuted }} variant="caption">
            Última sincronização: {formatSyncDate(catalog.data.syncedAt)}
          </AppText>
        </>
      ) : catalog.isLoading ? (
        <AppText>Preparando o catálogo local pela primeira vez…</AppText>
      ) : (
        <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          O catálogo ainda não está disponível neste dispositivo.
        </AppText>
      )}
      {synchronization.isError ? (
        <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          Não foi possível sincronizar. O catálogo anterior foi preservado.
        </AppText>
      ) : null}
      {synchronization.isSuccess ? (
        <AppText accessibilityLiveRegion="polite" style={{ color: theme.colors.success }}>
          Catálogo sincronizado.
        </AppText>
      ) : null}
      <PrimaryButton
        disabled={synchronization.isPending}
        label={synchronization.isPending ? 'Sincronizando…' : 'Sincronizar catálogo'}
        onPress={() => synchronization.mutate()}
        testID="exercise-catalog-sync"
      />
    </Card>
  );
}
