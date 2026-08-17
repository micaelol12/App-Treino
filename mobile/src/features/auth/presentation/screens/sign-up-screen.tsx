import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import { spacing } from '@/shared/theme/tokens';

import { useAuth } from '../auth-context';
import { getAuthErrorMessage } from '../auth-error-message';
import { signUpSchema, type SignUpFormValues } from '../auth-form.schema';
import { AuthFeedback } from '../components/auth-feedback';
import { AuthFormField } from '../components/auth-form-field';
import { AuthLink } from '../components/auth-link';

export function SignUpScreen() {
  const { signUp, startupError } = useAuth();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', passwordConfirmation: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setSubmissionError(null);

    try {
      await signUp({ email, password });
    } catch (error) {
      setSubmissionError(getAuthErrorMessage(error));
    }
  });

  return (
    <Screen
      title="Criar conta"
      description="Use um e-mail válido para recuperar o acesso."
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
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="voce@exemplo.com"
                returnKeyType="next"
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
                autoComplete="new-password"
                error={fieldState.error?.message}
                label="Senha"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Mínimo de 6 caracteres"
                ref={passwordRef}
                returnKeyType="next"
                secureTextEntry
                onSubmitEditing={() => confirmationRef.current?.focus()}
                testID="auth-password-input"
                textContentType="newPassword"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="passwordConfirmation"
            render={({ field, fieldState }) => (
              <AuthFormField
                autoComplete="new-password"
                error={fieldState.error?.message}
                label="Confirmar senha"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Repita sua senha"
                ref={confirmationRef}
                returnKeyType="done"
                secureTextEntry
                onSubmitEditing={() => void submit()}
                testID="auth-password-confirmation-input"
                textContentType="newPassword"
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
            label={isSubmitting ? 'Criando conta…' : 'Criar conta'}
            onPress={submit}
            testID="auth-sign-up-button"
          />
        </View>
      </Card>
      <AuthLink href="/login" label="Já tenho uma conta" testID="auth-login-link" />
    </Screen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.md } });
