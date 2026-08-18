import { type ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

type WorkoutPlanActionProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  readonly label: string;
  readonly tone?: 'default' | 'danger';
};

export function WorkoutPlanAction({
  accessibilityLabel,
  accessibilityState,
  disabled,
  label,
  style,
  tone = 'default',
  ...props
}: WorkoutPlanActionProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      style={(state) => [
        styles.action,
        {
          backgroundColor: state.pressed
            ? theme.colors.surfaceMuted
            : theme.colors.surface,
          borderColor: tone === 'danger' ? theme.colors.danger : theme.colors.border,
          opacity: disabled ? 0.4 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: tone === 'danger' ? theme.colors.danger : theme.colors.primary,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
});
