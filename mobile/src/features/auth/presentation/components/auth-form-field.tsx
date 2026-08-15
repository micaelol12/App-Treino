import { type ComponentProps } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

type AuthFormFieldProps = ComponentProps<typeof TextInput> & {
  readonly error?: string | undefined;
  readonly label: string;
};

export function AuthFormField({ error, label, style, ...props }: AuthFormFieldProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.field}>
      <AppText variant="caption">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textMuted}
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            color: theme.colors.text,
          },
          style,
        ]}
      />
      {error ? (
        <AppText accessibilityLiveRegion="polite" style={{ color: theme.colors.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: 16,
  },
});
