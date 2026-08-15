import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/presentation/auth-context';
import { getAuthErrorMessage } from '@/features/auth/presentation/auth-error-message';
import { AuthFeedback } from '@/features/auth/presentation/components/auth-feedback';
import { WorkoutPlansSection } from '@/features/workout-plans/presentation/components/workout-plans-section';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import {
  type ThemePreference,
  usePreferencesStore,
} from '@/shared/stores/preferences.store';
import { spacing } from '@/shared/theme/tokens';

const choices: { label: string; value: ThemePreference }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
];

export default function SettingsRoute() {
  const { session, signOut } = useAuth();
  const preference = usePreferencesStore((state) => state.themePreference);
  const setPreference = usePreferencesStore((state) => state.setThemePreference);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
    } catch (error) {
      setSignOutError(getAuthErrorMessage(error));
      setIsSigningOut(false);
    }
  };

  return (
    <Screen title="Configurações" description="Personalize sua experiência.">
      <WorkoutPlansSection />
      <Card>
        <AppText variant="heading">Conta</AppText>
        <AppText>{session?.email}</AppText>
        {signOutError ? <AuthFeedback message={signOutError} /> : null}
        <PrimaryButton
          disabled={isSigningOut}
          label={isSigningOut ? 'Saindo…' : 'Sair da conta'}
          onPress={handleSignOut}
          testID="auth-sign-out-button"
        />
      </Card>
      <Card>
        <AppText variant="heading">Aparência</AppText>
        <View style={styles.options}>
          {choices.map((choice) => (
            <PrimaryButton
              disabled={choice.value === preference}
              key={choice.value}
              label={choice.label}
              onPress={() => setPreference(choice.value)}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ options: { gap: spacing.sm } });
