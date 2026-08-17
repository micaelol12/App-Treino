import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps, forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

type AuthFormFieldProps = ComponentProps<typeof TextInput> & {
  readonly error?: string | undefined;
  readonly label: string;
};

export const AuthFormField = forwardRef<TextInput, AuthFormFieldProps>(
  function AuthFormField(
    { error, label, secureTextEntry = false, style, ...props },
    ref,
  ) {
    const theme = useAppTheme();
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
      <View style={styles.field}>
        <AppText variant="caption">{label}</AppText>
        <View style={styles.inputContainer}>
          <TextInput
            accessibilityLabel={label}
            placeholderTextColor={theme.colors.textMuted}
            ref={ref}
            secureTextEntry={secureTextEntry && !passwordVisible}
            {...props}
            style={[
              styles.input,
              secureTextEntry ? styles.passwordInput : undefined,
              {
                backgroundColor: theme.colors.surface,
                borderColor: error ? theme.colors.danger : theme.colors.border,
                color: theme.colors.text,
              },
              style,
            ]}
          />
          {secureTextEntry ? (
            <Pressable
              accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => setPasswordVisible((visible) => !visible)}
              style={styles.passwordAction}
              testID={props.testID ? `${props.testID}-visibility` : undefined}
            >
              <Ionicons
                color={theme.colors.textMuted}
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={24}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <AppText
            accessibilityLiveRegion="polite"
            style={{ color: theme.colors.danger }}
          >
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  inputContainer: { position: 'relative' },
  input: {
    width: '100%',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: 16,
  },
  passwordInput: { paddingRight: 56 },
  passwordAction: {
    position: 'absolute',
    right: 4,
    top: 0,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
