import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { spacing } from '@/shared/theme/tokens';

import { useAuth } from '../auth-context';
import { getAuthErrorMessage } from '../auth-error-message';
import { loginSchema, type LoginFormValues } from '../auth-form.schema';
import { AuthFeedback } from '../components/auth-feedback';
import { AuthFormField } from '../components/auth-form-field';
import { AuthLink } from '../components/auth-link';

export function LoginScreen() {
  const { signIn, startupError } = useAuth();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setSubmissionError(null);

    try {
      await signIn(values);
    } catch (error) {
      setSubmissionError(getAuthErrorMessage(error));
    }
  });

  return (
    <Screen title="Entrar" description="Acesse com o e-mail da sua conta.">
      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <AuthFormField
                autoCapitalize="none"
                autoComplete="email"
                error={fieldState.error?.message}
                keyboardType="email-address"
                label="E-mail"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="voce@exemplo.com"
                testID="auth-email-input"
                textContentType="username"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <AuthFormField
                autoComplete="current-password"
                error={fieldState.error?.message}
                label="Senha"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Sua senha"
                secureTextEntry
                testID="auth-password-input"
                textContentType="password"
                value={field.value}
              />
            )}
          />
          {startupError ? (
            <AuthFeedback message={getAuthErrorMessage(startupError)} />
          ) : null}
          {submissionError ? <AuthFeedback message={submissionError} /> : null}
          <PrimaryButton
            disabled={isSubmitting || Boolean(startupError)}
            label={isSubmitting ? 'Entrando…' : 'Entrar'}
            onPress={submit}
            testID="auth-login-button"
          />
          <AuthLink
            href="/recuperar-senha"
            label="Esqueci minha senha"
            testID="auth-reset-link"
          />
        </View>
      </Card>
      <View style={styles.footer}>
        <AppText>Ainda não possui uma conta?</AppText>
        <AuthLink href="/cadastro" label="Criar conta" testID="auth-sign-up-link" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  footer: { alignItems: 'center', gap: spacing.xs },
});
