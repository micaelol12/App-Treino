import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';
import {
  civilDateToDate,
  dateToCivilDate,
  formatCivilDate,
} from '@/shared/validation/civil-date';

import { AppText } from './app-text';
import { InfoModal } from './info-modal';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

type DatePickerFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly testID?: string;
};

function monthStart(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1, 12);
}

function monthLabel(value: Date): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(value);
  return formatted.charAt(0).toLocaleUpperCase('pt-BR') + formatted.slice(1);
}

function calendarDays(month: Date): (number | null)[] {
  const firstWeekday = month.getDay();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
  const cells = Math.ceil((firstWeekday + count) / 7) * 7;
  return Array.from({ length: cells }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= count ? day : null;
  });
}

export function DatePickerField({
  disabled = false,
  label,
  onChange,
  testID,
  value,
}: DatePickerFieldProps) {
  const theme = useAppTheme();
  const selectedDate = civilDateToDate(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(selectedDate));
  const days = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);

  const openCalendar = () => {
    setVisibleMonth(monthStart(civilDateToDate(value)));
    setOpen(true);
  };

  const moveMonth = (offset: number) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  };

  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <Pressable
        accessibilityHint="Abre o calendário"
        accessibilityLabel={`${label}: ${formatCivilDate(value)}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={openCalendar}
        style={({ pressed }) => [
          styles.control,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}
        testID={testID}
      >
        <AppText>{formatCivilDate(value)}</AppText>
        <Ionicons color={theme.colors.primary} name="calendar-outline" size={22} />
      </Pressable>

      <InfoModal onClose={() => setOpen(false)} title="Selecionar data" visible={open}>
        <View style={styles.monthHeader}>
          <Pressable
            accessibilityLabel="Mês anterior"
            accessibilityRole="button"
            onPress={() => moveMonth(-1)}
            style={styles.monthButton}
            testID={testID ? `${testID}-previous-month` : undefined}
          >
            <Ionicons color={theme.colors.primary} name="chevron-back" size={26} />
          </Pressable>
          <AppText accessibilityRole="header" style={styles.monthTitle}>
            {monthLabel(visibleMonth)}
          </AppText>
          <Pressable
            accessibilityLabel="Próximo mês"
            accessibilityRole="button"
            onPress={() => moveMonth(1)}
            style={styles.monthButton}
            testID={testID ? `${testID}-next-month` : undefined}
          >
            <Ionicons color={theme.colors.primary} name="chevron-forward" size={26} />
          </Pressable>
        </View>

        <View accessibilityLabel="Calendário" style={styles.calendar}>
          {WEEKDAYS.map((weekday) => (
            <View key={weekday} style={styles.dayCell}>
              <AppText style={[styles.weekday, { color: theme.colors.textMuted }]}>
                {weekday}
              </AppText>
            </View>
          ))}
          {days.map((day, index) => {
            if (day === null)
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            const date = new Date(
              visibleMonth.getFullYear(),
              visibleMonth.getMonth(),
              day,
              12,
            );
            const civilDate = dateToCivilDate(date);
            const selected = civilDate === value;
            return (
              <View key={civilDate} style={styles.dayCell}>
                <Pressable
                  accessibilityLabel={formatCivilDate(civilDate)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onChange(civilDate);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.day,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : pressed
                          ? theme.colors.surfaceMuted
                          : 'transparent',
                    },
                  ]}
                  testID={testID ? `${testID}-day-${civilDate}` : undefined}
                >
                  <AppText
                    style={{
                      color: selected ? theme.colors.onPrimary : theme.colors.text,
                      fontWeight: selected ? '700' : '400',
                    }}
                  >
                    {day}
                  </AppText>
                </Pressable>
              </View>
            );
          })}
        </View>
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
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  monthButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { flex: 1, fontWeight: '700', textAlign: 'center' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', padding: 2 },
  weekday: { paddingVertical: spacing.xs, fontSize: 12, textAlign: 'center' },
  day: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
});
