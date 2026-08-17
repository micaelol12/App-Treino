import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { getAuthErrorMessage } from '../auth-error-message';
import { AuthFeedback } from './auth-feedback';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { SecondaryButton } from '@/shared/components/secondary-button';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { radius, spacing } from '@/shared/theme/tokens';

type AccountDeletionSectionProps = {
  readonly deleteAccount: (password: string) => Promise<void>;
};

export function AccountDeletionSection({ deleteAccount }: AccountDeletionSectionProps) {
  const theme = useAppTheme();
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDeletion = () => {
    setError(null);
    if (!password) {
      setError('Informe sua senha atual para confirmar a exclusão.');
      return;
    }

    Alert.alert(
      'Excluir conta e dados?',
      'Esta ação remove permanentemente seus treinos, histórico e pesagens. Ela não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir permanentemente',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(true);
            void deleteAccount(password).catch((failure) => {
              setError(getAuthErrorMessage(failure));
              setIsDeleting(false);
            });
          },
        },
      ],
    );
  };

  return (
    <Card>
      <AppText variant="heading">Excluir conta</AppText>
      <AppText style={{ color: theme.colors.textMuted }}>
        A exclusão apaga permanentemente o plano, os treinos e as pesagens vinculadas à
        sua conta.
      </AppText>
      <View style={styles.field}>
        <AppText style={styles.label}>Senha atual</AppText>
        <TextInput
          accessibilityLabel="Senha atual para excluir a conta"
          autoCapitalize="none"
          autoComplete="current-password"
          editable={!isDeleting}
          onChangeText={setPassword}
          secureTextEntry
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          testID="account-deletion-password"
          value={password}
        />
      </View>
      {error ? <AuthFeedback message={error} /> : null}
      <SecondaryButton
        disabled={isDeleting}
        label={isDeleting ? 'Excluindo…' : 'Excluir conta e dados'}
        onPress={confirmDeletion}
        testID="account-deletion-button"
        tone="danger"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontWeight: '700' },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 16,
  },
});
