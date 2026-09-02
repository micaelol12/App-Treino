import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import {
  findCatalogExercise,
  rankEquivalentExercises,
} from '@/features/exercise-catalog/domain/exercise-equivalence';
import { useExerciseCatalogSnapshot } from '@/features/exercise-catalog/presentation/exercise-catalog-hooks';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { EmptyState } from '@/shared/components/empty-state';
import { InfoModal } from '@/shared/components/info-modal';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import type {
  WorkoutExerciseDraft,
  WorkoutExerciseReplacement,
} from '../../domain/workout-session-draft';
import { hasEditedWorkoutSets } from '../../domain/workout-session-rules';

export function EquivalentExerciseButton({
  exercise,
  onReplace,
  sessionExercises,
}: {
  readonly exercise: WorkoutExerciseDraft;
  readonly onReplace: (replacement: WorkoutExerciseReplacement) => void;
  readonly sessionExercises: readonly WorkoutExerciseDraft[];
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const catalog = useExerciseCatalogSnapshot();
  const source = useMemo(
    () =>
      findCatalogExercise(catalog.data?.exercises ?? [], {
        exerciseDocumentId: exercise.exerciseDocumentId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
      }),
    [
      catalog.data?.exercises,
      exercise.exerciseDocumentId,
      exercise.exerciseId,
      exercise.name,
    ],
  );
  const equivalents = useMemo(() => {
    if (!source || !catalog.data) return [];

    return rankEquivalentExercises(source, catalog.data.exercises, {
      excludedDocumentIds: new Set(
        sessionExercises.flatMap((item) =>
          item.exerciseDocumentId ? [item.exerciseDocumentId] : [],
        ),
      ),
      excludedExerciseIds: new Set(sessionExercises.map((item) => item.exerciseId)),
    });
  }, [catalog.data, sessionExercises, source]);
  const labels = useMemo(
    () =>
      new Map(
        catalog.data?.taxonomies.musculos.map((muscle) => [muscle.id, muscle.name]) ?? [],
      ),
    [catalog.data?.taxonomies.musculos],
  );
  const equipmentLabels = useMemo(
    () =>
      new Map(
        catalog.data?.taxonomies.equipamentos.map((equipment) => [
          equipment.id,
          equipment.name,
        ]) ?? [],
      ),
    [catalog.data?.taxonomies.equipamentos],
  );

  const replace = (replacement: WorkoutExerciseReplacement) => {
    onReplace(replacement);
    setOpen(false);
    AccessibilityInfo.announceForAccessibility(
      `${exercise.name} foi substituído por ${replacement.name}.`,
    );
  };

  const select = (replacement: WorkoutExerciseReplacement) => {
    if (!hasEditedWorkoutSets(exercise.sets)) {
      replace(replacement);
      return;
    }

    Alert.alert(
      'Substituir exercício?',
      `Os valores preenchidos em ${exercise.name} serão apagados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Substituir e limpar séries',
          style: 'destructive',
          onPress: () => replace(replacement),
        },
      ],
    );
  };

  return (
    <>
      <Pressable
        accessibilityHint="Mostra exercícios que trabalham músculos semelhantes"
        accessibilityLabel={`Exercício equivalente para ${exercise.name}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.65 : 1 }]}
        testID={`equivalent-exercise-${exercise.name}`}
      >
        <Ionicons color={theme.colors.primary} name="swap-horizontal-outline" size={26} />
      </Pressable>
      <InfoModal
        onClose={() => setOpen(false)}
        title={`Exercícios equivalentes a ${exercise.name}`}
        visible={open}
      >
        {catalog.isLoading ? (
          <AppText accessibilityLiveRegion="polite">
            Buscando exercícios equivalentes…
          </AppText>
        ) : null}
        {catalog.isError ? (
          <AppText accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            Não foi possível carregar o catálogo de exercícios.
          </AppText>
        ) : null}
        {catalog.isSuccess && !source ? (
          <EmptyState
            description="Os dados musculares deste exercício não estão disponíveis no catálogo."
            title="Exercício não encontrado"
          />
        ) : null}
        {catalog.isSuccess && source && equivalents.length === 0 ? (
          <EmptyState
            description="Exercícios inativos e os que já estão neste treino não aparecem."
            title="Nenhum exercício equivalente disponível"
          />
        ) : null}
        {equivalents.map((equivalent) => {
          const primaryMuscles = equivalent.sharedPrimaryMuscles.map(
            (muscle) => labels.get(muscle) ?? muscle,
          );
          const otherMuscles = equivalent.sharedOtherMuscles.map(
            (muscle) => labels.get(muscle) ?? muscle,
          );
          const equipment = equivalent.exercise.equipment
            ? (equipmentLabels.get(equivalent.exercise.equipment) ??
              equivalent.exercise.equipment)
            : 'Não informado';
          const accessibilityDetails = [
            `principal em comum: ${primaryMuscles.join(', ')}`,
            ...(otherMuscles.length
              ? [`outros músculos em comum: ${otherMuscles.join(', ')}`]
              : []),
            `equipamento: ${equipment}`,
          ].join('. ');

          return (
            <Card key={equivalent.exercise.documentId}>

              <View
                accessibilityLabel={`${equivalent.exercise.name}. ${accessibilityDetails}`}
                style={styles.copy}
              >
                <AppText style={styles.name}>{equivalent.exercise.name}</AppText>
                <AppText variant="caption">
                  Principal em comum: {primaryMuscles.join(', ')}
                </AppText>
                {otherMuscles.length ? (
                  <AppText variant="caption">
                    Outros em comum: {otherMuscles.join(', ')}
                  </AppText>
                ) : null}
                <AppText style={{ color: theme.colors.textMuted }} variant="caption">
                  Equipamento: {equipment}
                </AppText>
                {equivalent.exercise?.videoUrl && (
                  <Image
                    source={{ uri: equivalent.exercise.videoUrl }}
                    style={{ ...styles.video, borderColor: theme.colors.border }}
                    contentFit="cover"
                  />
                )}
              </View>
              <SecondaryButton
                accessibilityLabel={`Substituir por ${equivalent.exercise.name}`}
                label="Substituir"
                onPress={() =>
                  select({
                    exerciseId: equivalent.exercise.id,
                    exerciseDocumentId: equivalent.exercise.documentId,
                    name: equivalent.exercise.name,
                  })
                }
                testID={`select-equivalent-${equivalent.exercise.documentId}`}
              />
            </Card>
          );
        })}
      </InfoModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: spacing.xxs },
  name: { fontWeight: '700' },
  video: {
    width: '80%',
    height: 200,
    marginBottom: spacing.sm,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
});
