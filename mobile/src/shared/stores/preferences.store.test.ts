import AsyncStorage from '@react-native-async-storage/async-storage';

import { usePreferencesStore } from './preferences.store';

describe('preferences store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState({
      themePreference: 'system',
      colorThemePreference: 'purple',
    });
  });

  it('persists display mode and color independently', async () => {
    usePreferencesStore.getState().setThemePreference('dark');
    usePreferencesStore.getState().setColorThemePreference('green');

    expect(usePreferencesStore.getState()).toEqual(
      expect.objectContaining({
        themePreference: 'dark',
        colorThemePreference: 'green',
      }),
    );
  });

  it('migrates the original preference to the existing purple palette', async () => {
    await AsyncStorage.setItem(
      'app-treino-preferences',
      JSON.stringify({ state: { themePreference: 'dark' }, version: 0 }),
    );

    await usePreferencesStore.persist.rehydrate();

    expect(usePreferencesStore.getState()).toEqual(
      expect.objectContaining({
        themePreference: 'dark',
        colorThemePreference: 'purple',
      }),
    );
  });
});
