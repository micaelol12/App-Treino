import { StyleSheet, View } from 'react-native';

import type { Exercise } from '../../domain/exercise';
import { AppText } from '@/shared/components/app-text';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

type ChipKind = 'muscle' | 'equipment' | 'level';

const lightColors: Record<
  ChipKind,
  { background: string; border: string; text: string }
> = {
  muscle: { background: '#E8EEFF', border: '#9DB1FF', text: '#2949A8' },
  equipment: { background: '#E6F6EC', border: '#86D5A8', text: '#176B3A' },
  level: { background: '#FFF2D8', border: '#F2C66D', text: '#8A4B08' },
};

const darkColors: typeof lightColors = {
  muscle: { background: '#24335F', border: '#526AAE', text: '#D5DEFF' },
  equipment: { background: '#173C2A', border: '#327553', text: '#B9F4D1' },
  level: { background: '#4A3212', border: '#916724', text: '#FFE2A8' },
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function MetadataChip({ kind, label }: { kind: ChipKind; label: string }) {
  const theme = useAppTheme();
  const colors = (theme.dark ? darkColors : lightColors)[kind];
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      testID={`exercise-chip-${kind}-${normalize(label)}`}
    >
      <AppText style={{ color: colors.text }} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

export function ExerciseMetadataChips({ exercise }: { exercise: Exercise }) {
  const chips: { kind: ChipKind; label: string }[] = [
    ...exercise.primaryMuscles.map((label) => ({ kind: 'muscle' as const, label })),
    ...(exercise.equipment
      ? [{ kind: 'equipment' as const, label: exercise.equipment }]
      : []),
    { kind: 'level', label: exercise.level },
  ];
  return (
    <View
      accessibilityLabel={chips.map(({ label }) => label).join(', ')}
      style={styles.list}
    >
      {chips.map(({ kind, label }) => (
        <MetadataChip key={`${kind}-${label}`} kind={kind} label={label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  chip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
});
