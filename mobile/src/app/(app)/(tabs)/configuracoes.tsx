import { StyleSheet, View } from 'react-native';

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
  const preference = usePreferencesStore((state) => state.themePreference);
  const setPreference = usePreferencesStore((state) => state.setThemePreference);

  return (
    <Screen title="Configurações" description="Personalize sua experiência.">
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
