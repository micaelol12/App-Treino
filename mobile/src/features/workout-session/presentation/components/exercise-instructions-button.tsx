import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { useExerciseCatalog } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import { AppText } from '@/shared/components/app-text';
import { EmptyState } from '@/shared/components/empty-state';
import { InfoModal } from '@/shared/components/info-modal';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

export function ExerciseInstructionsButton({
  exerciseDocumentId,
  exerciseId,
  exerciseName,
}: {
  exerciseDocumentId?: string | undefined;
  exerciseId?: string | undefined;
  exerciseName: string;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const catalog = useExerciseCatalog();
  const exercise = catalog.data?.find(
    (catalogExercise) =>
      (exerciseDocumentId && catalogExercise.documentId === exerciseDocumentId) ||
      (exerciseId && catalogExercise.id === exerciseId) ||
      catalogExercise.name === exerciseName,
  );

  return (
    <>
      <Pressable
        accessibilityHint="Mostra como executar este exercício"
        accessibilityLabel={`Instruções de ${exerciseName}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.65 : 1 }]}
        testID={`exercise-instructions-${exerciseName}`}
      >
        <Ionicons color={theme.colors.primary} name="help-circle-outline" size={27} />
      </Pressable>
      <InfoModal
        onClose={() => setOpen(false)}
        title={`Instruções · ${exerciseName}`}
        visible={open}
      >
        {catalog.isLoading ? (
          <AppText accessibilityLiveRegion="polite">Carregando instruções…</AppText>
        ) : null}
        {catalog.isError ? (
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            Não foi possível carregar as instruções deste exercício.
          </AppText>
        ) : null}
        {catalog.isSuccess && (!exercise || exercise.instructions.length === 0) ? (
          <EmptyState
            description="Este exercício ainda não possui orientações cadastradas."
            title="Instruções indisponíveis"
          />
        ) : null}
        {exercise?.videoUrl && (
          <Image
            source={{ uri: exercise.videoUrl }}
            style={{...styles.video,borderColor: theme.colors.border}}
            contentFit="cover"
          />
        )}
        {exercise?.instructions.map((instruction, index) => (
          <View key={`${index}-${instruction}`} style={styles.instruction}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[styles.number, { backgroundColor: theme.colors.surfaceMuted }]}
            >
              <AppText style={styles.numberText} variant="caption">
                {index + 1}
              </AppText>
            </View>
            <AppText style={styles.instructionText}>{instruction}</AppText>
          </View>
        ))}
      </InfoModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  instructionText: { flex: 1 },
  number: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  numberText: { fontWeight: '700' },
  video: { width: '80%', height: 200, marginBottom: spacing.sm, alignSelf: 'center', borderRadius: 8, borderWidth: 1, },
});
