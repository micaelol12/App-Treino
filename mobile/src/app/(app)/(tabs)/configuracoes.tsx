import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/presentation/auth-context';
import { getAuthErrorMessage } from '@/features/auth/presentation/auth-error-message';
import { AuthFeedback } from '@/features/auth/presentation/components/auth-feedback';
import { AccountDeletionSection } from '@/features/auth/presentation/components/account-deletion-section';
import { ExerciseCatalogSyncSection } from '@/features/exercise-catalog/presentation/components/exercise-catalog-sync-section';
import { AppText } from '@/shared/components/app-text';
import { Card } from '@/shared/components/card';
import { ExternalLink } from '@/shared/components/external-link';
import { PrimaryButton } from '@/shared/components/primary-button';
import { Screen } from '@/shared/components/screen';
import {
  type ThemePreference,
  usePreferencesStore,
} from '@/shared/stores/preferences.store';
import { useAppTheme } from '@/shared/theme/theme-provider';
import {
  colorPalettes,
  radius,
  spacing,
  type ThemeColorPreference,
} from '@/shared/theme/tokens';

const choices: { label: string; value: ThemePreference }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
];

const colorChoices = Object.entries(colorPalettes) as [
  ThemeColorPreference,
  (typeof colorPalettes)[ThemeColorPreference],
][];
const workoutPlansRoute = '/configuracoes/planos' as Href;

export default function SettingsRoute() {
  const router = useRouter();
  const theme = useAppTheme();
  const { deleteAccount, session, signOut } = useAuth();
  const preference = usePreferencesStore((state) => state.themePreference);
  const setPreference = usePreferencesStore((state) => state.setThemePreference);
  const colorPreference = usePreferencesStore((state) => state.colorThemePreference);
  const setColorPreference = usePreferencesStore(
    (state) => state.setColorThemePreference,
  );
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
      <Card>
        <AppText variant="heading">Plano de treino</AppText>
        <AppText>Organize suas divisões, exercícios, séries e ordem.</AppText>
        <PrimaryButton
          label="Gerenciar plano"
          onPress={() => router.push(workoutPlansRoute)}
          testID="settings-workout-plan"
        />
      </Card>
      <ExerciseCatalogSyncSection />
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
      <AccountDeletionSection deleteAccount={deleteAccount} />
      <Card>
        <AppText variant="heading">Privacidade</AppText>
        <AppText>
          Consulte quais dados são usados, por que são necessários e como são excluídos.
        </AppText>
        <ExternalLink
          label="Abrir política de privacidade"
          url="https://github.com/micaelol12/App-Treino/blob/main/docs/legal/PRIVACY_POLICY.md"
        />
      </Card>
      <Card>
        <AppText variant="heading">Aparência</AppText>
        <AppText style={styles.label}>Modo</AppText>
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
        <AppText style={styles.label}>Cor principal</AppText>
        <View accessibilityRole="radiogroup" style={styles.colorOptions}>
          {colorChoices.map(([value, palette]) => {
            const selected = value === colorPreference;
            return (
              <Pressable
                accessibilityLabel={palette.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={value}
                onPress={() => setColorPreference(value)}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                testID={`theme-color-${value}`}
              >
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.swatch, { backgroundColor: palette.primary }]}
                />
                <AppText style={styles.colorLabel}>{palette.label}</AppText>
                {selected ? <AppText variant="caption">Selecionado</AppText> : null}
              </Pressable>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  label: { fontWeight: '700', marginTop: spacing.xs },
  colorOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  colorOption: {
    minHeight: 72,
    minWidth: 132,
    flexGrow: 1,
    flexBasis: '45%',
    justifyContent: 'center',
    gap: spacing.xxs,
    padding: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  swatch: { width: 32, height: 16, borderRadius: radius.pill },
  colorLabel: { fontWeight: '700' },
});
