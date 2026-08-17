import { type ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

type PrimaryButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  label: string;
};

export function PrimaryButton({
  accessibilityLabel,
  accessibilityState,
  disabled,
  label,
  style,
  ...props
}: PrimaryButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor: state.pressed
            ? theme.colors.primaryPressed
            : theme.colors.primary,
          opacity: disabled ? 0.5 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AppText style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
