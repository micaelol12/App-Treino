import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { Exercise } from '../../domain/exercise';
import { AppText } from '@/shared/components/app-text';
import { InfoModal } from '@/shared/components/info-modal';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { ExerciseMetadataChips } from './exercise-metadata-chips';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

function values(items: readonly (string | null)[]): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)))].sort(
    (left, right) => left.localeCompare(right, 'pt-BR', { sensitivity: 'base' }),
  );
}

function FilterGroup({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string | null) => void;
  options: readonly string[];
  value: string | null;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.filterGroup}>
      <AppText style={styles.filterLabel}>{label}</AppText>
      <View style={styles.filters}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => onChange(selected ? null : option)}
              style={[
                styles.filter,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.surfaceMuted,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                },
              ]}
              testID={`exercise-filter-${normalize(label)}-${normalize(option)}`}
            >
              <AppText
                style={{ color: selected ? theme.colors.onPrimary : theme.colors.text }}
                variant="caption"
              >
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ExerciseCatalogSelect({
  exercises,
  onChange,
  testID,
  value,
}: {
  exercises: readonly Exercise[];
  onChange: (value: string) => void;
  testID?: string;
  value: string;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const selected = exercises.find(({ documentId }) => documentId === value);
  const muscles = useMemo(
    () => values(exercises.flatMap((exercise) => exercise.primaryMuscles)),
    [exercises],
  );
  const equipments = useMemo(
    () => values(exercises.map((exercise) => exercise.equipment)),
    [exercises],
  );
  const levels = useMemo(
    () => values(exercises.map((exercise) => exercise.level)),
    [exercises],
  );
  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    return exercises.filter(
      (exercise) =>
        (!term || normalize(exercise.name).includes(term)) &&
        (!muscle || exercise.primaryMuscles.includes(muscle)) &&
        (!equipment || exercise.equipment === equipment) &&
        (!level || exercise.level === level),
    );
  }, [equipment, exercises, level, muscle, search]);
  const hasFilters = Boolean(muscle || equipment || level);
  const activeFilterCount = [muscle, equipment, level].filter(Boolean).length;
  const clear = () => {
    setMuscle(null);
    setEquipment(null);
    setLevel(null);
  };
  const close = () => {
    setOpen(false);
    setSearch('');
    setShowFilters(false);
  };

  return (
    <View style={styles.field}>
      <AppText style={styles.label}>Exercício</AppText>
      <Pressable
        accessibilityLabel={`Exercício: ${selected?.name ?? 'Selecione'}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[
          styles.control,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        testID={testID}
      >
        <AppText numberOfLines={1} style={styles.controlValue}>
          {selected?.name ?? 'Selecione'}
        </AppText>
        <Ionicons color={theme.colors.textMuted} name="chevron-down" size={22} />
      </Pressable>
      {selected ? <ExerciseMetadataChips exercise={selected} /> : null}
      <InfoModal
        expanded
        onClose={close}
        scrollable={false}
        title="Selecionar exercício"
        visible={open}
      >
        <View style={styles.toolbar}>
          <TextInput
            accessibilityLabel="Pesquisar exercício"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Pesquisar por nome…"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.search,
              { borderColor: theme.colors.border, color: theme.colors.text },
            ]}
            testID={testID ? `${testID}-search` : undefined}
            value={search}
          />
          <Pressable
            accessibilityLabel="Filtros de exercícios"
            accessibilityRole="button"
            accessibilityState={{ expanded: showFilters, selected: hasFilters }}
            onPress={() => setShowFilters((current) => !current)}
            style={[
              styles.filterToggle,
              {
                backgroundColor: hasFilters
                  ? theme.colors.surfaceMuted
                  : theme.colors.surface,
                borderColor: hasFilters ? theme.colors.primary : theme.colors.border,
              },
            ]}
            testID="exercise-filter-toggle"
          >
            <Ionicons
              color={hasFilters ? theme.colors.primary : theme.colors.textMuted}
              name="funnel"
              size={22}
            />
            {activeFilterCount ? (
              <AppText style={{ color: theme.colors.primary }} variant="caption">
                {activeFilterCount}
              </AppText>
            ) : null}
          </Pressable>
        </View>
        {showFilters ? (
          <View
            style={[
              styles.filterPanel,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.filterPanelContent}
              nestedScrollEnabled
            >
              <FilterGroup
                label="Músculo"
                onChange={setMuscle}
                options={muscles}
                value={muscle}
              />
              <FilterGroup
                label="Equipamento"
                onChange={setEquipment}
                options={equipments}
                value={equipment}
              />
              <FilterGroup
                label="Nível"
                onChange={setLevel}
                options={levels}
                value={level}
              />
            </ScrollView>
            <View style={styles.filterActions}>
              {hasFilters ? (
                <SecondaryButton label="Limpar filtros" onPress={clear} />
              ) : null}
              <SecondaryButton
                label="Aplicar filtros"
                onPress={() => setShowFilters(false)}
              />
            </View>
          </View>
        ) : null}
        <AppText variant="caption">{filtered.length} exercício(s)</AppText>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filtered}
          initialNumToRender={12}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(exercise) => exercise.documentId}
          ListEmptyComponent={<AppText>Nenhum exercício encontrado.</AppText>}
          maxToRenderPerBatch={12}
          removeClippedSubviews
          renderItem={({ item: exercise }) => {
            const isSelected = exercise.documentId === value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                key={exercise.documentId}
                onPress={() => {
                  onChange(exercise.documentId);
                  close();
                }}
                style={[
                  styles.option,
                  { backgroundColor: isSelected ? theme.colors.surfaceMuted : undefined },
                ]}
              >
                <View style={styles.optionCopy}>
                  <AppText style={styles.optionName}>{exercise.name}</AppText>
                  <ExerciseMetadataChips exercise={exercise} />
                </View>
                {isSelected ? (
                  <Ionicons color={theme.colors.primary} name="checkmark" size={22} />
                ) : null}
              </Pressable>
            );
          }}
          style={styles.list}
          windowSize={5}
        />
      </InfoModal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontWeight: '700' },
  control: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  controlValue: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  search: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: 16,
  },
  filterGroup: { gap: spacing.xs },
  filterLabel: { fontWeight: '700' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filter: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  filterToggle: {
    minHeight: 48,
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  filterPanel: {
    maxHeight: 340,
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  filterPanelContent: { gap: spacing.md },
  filterActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  list: { flex: 1 },
  listContent: { gap: spacing.xxs, paddingBottom: spacing.md },
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  optionCopy: { flex: 1, gap: spacing.xs },
  optionName: { fontWeight: '700' },
});
