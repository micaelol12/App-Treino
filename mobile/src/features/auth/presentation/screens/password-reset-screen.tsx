import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { spacing } from '@/shared/theme/tokens';

import { useAuth } from '../auth-context';
import { getAuthErrorMessage } from '../auth-error-message';
import { passwordResetSchema, type PasswordResetFormValues } from '../auth-form.schema';
import { AuthFeedback } from '../components/auth-feedback';
import { AuthFormField } from '../components/auth-form-field';
import { AuthLink } from '../components/auth-link';

const successMessage =
  'Se houver uma conta para este e-mail, enviaremos as instruções de redefinição.';

export function PasswordResetScreen() {
  const { sendPasswordReset, startupError } = useAuth();
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: 'danger' | 'success';
  } | null>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    setFeedback(null);

    try {
      await sendPasswordReset(email);
      setFeedback({ message: successMessage, tone: 'success' });
    } catch (error) {
      setFeedback({ message: getAuthErrorMessage(error), tone: 'danger' });
    }
  });

  return (
    <Screen
      title="Redefinir senha"
      description="Informe seu e-mail para receber as instruções."
    >
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
          {startupError ? (
            <AuthFeedback message={getAuthErrorMessage(startupError)} />
          ) : null}
          {feedback ? (
            <AuthFeedback message={feedback.message} tone={feedback.tone} />
          ) : null}
          <PrimaryButton
            disabled={isSubmitting || Boolean(startupError)}
            label={isSubmitting ? 'Enviando…' : 'Enviar instruções'}
            onPress={submit}
            testID="auth-reset-button"
          />
        </View>
      </Card>
      <AuthLink href="/login" label="Voltar para entrar" testID="auth-login-link" />
    </Screen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.md } });
