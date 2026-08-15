import { type ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

type SecondaryButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  readonly label: string;
  readonly tone?: 'default' | 'danger';
};

export function SecondaryButton({
  disabled,
  label,
  style,
  tone = 'default',
  ...props
}: SecondaryButtonProps) {
  const theme = useAppTheme();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...props}
      style={(state) => [
        styles.button,
        {
          backgroundColor: state.pressed ? theme.colors.surfaceMuted : 'transparent',
          borderColor: color,
          opacity: disabled ? 0.5 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AppText style={{ color, fontWeight: '700' }}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
