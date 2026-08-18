import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';
import { InfoModal } from './info-modal';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

type SearchableSelectProps = {
  readonly label: string;
  readonly options: readonly (string | SearchableSelectOption)[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly testID?: string;
};

export interface SearchableSelectOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

function toOption(option: string | SearchableSelectOption): SearchableSelectOption {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function SearchableSelect({
  label,
  onChange,
  options,
  testID,
  value,
}: SearchableSelectProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const normalizedOptions = useMemo(() => options.map(toOption), [options]);
  const selectedLabel =
    normalizedOptions.find((option) => option.value === value)?.label ?? value;
  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    return term
      ? normalizedOptions.filter((option) =>
          normalize(`${option.label} ${option.description ?? ''}`).includes(term),
        )
      : normalizedOptions;
  }, [normalizedOptions, search]);

  const close = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <Pressable
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.control,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        testID={testID}
      >
        <AppText numberOfLines={1} style={styles.value}>
          {selectedLabel || 'Selecione'}
        </AppText>
        <Ionicons color={theme.colors.textMuted} name="chevron-down" size={22} />
      </Pressable>
      <InfoModal
        expanded
        onClose={close}
        title={`Selecionar ${label.toLocaleLowerCase()}`}
        visible={open}
      >
        <TextInput
          accessibilityLabel={`Pesquisar ${label.toLocaleLowerCase()}`}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Pesquisar…"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.search,
            { borderColor: theme.colors.border, color: theme.colors.text },
          ]}
          testID={testID ? `${testID}-search` : undefined}
          value={search}
        />
        {filtered.length ? (
          filtered.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  close();
                }}
                style={[
                  styles.option,
                  { backgroundColor: selected ? theme.colors.surfaceMuted : undefined },
                ]}
              >
                <View style={styles.optionCopy}>
                  <AppText>{option.label}</AppText>
                  {option.description ? (
                    <AppText
                      numberOfLines={2}
                      style={{ color: theme.colors.textMuted }}
                      variant="caption"
                    >
                      {option.description}
                    </AppText>
                  ) : null}
                </View>
                {selected ? (
                  <Ionicons color={theme.colors.primary} name="checkmark" size={22} />
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <AppText style={{ color: theme.colors.textMuted }}>
            Nenhum exercício encontrado.
          </AppText>
        )}
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
  value: { flex: 1 },
  search: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: 16,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  optionCopy: { flex: 1, gap: spacing.xxs },
});
