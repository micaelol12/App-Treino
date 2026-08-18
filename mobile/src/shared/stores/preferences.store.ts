import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ThemeColorPreference } from '@/shared/theme/tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  themePreference: ThemePreference;
  colorThemePreference: ThemeColorPreference;
  setThemePreference: (preference: ThemePreference) => void;
  setColorThemePreference: (preference: ThemeColorPreference) => void;
};

type PersistedPreferences = Pick<
  PreferencesState,
  'themePreference' | 'colorThemePreference'
>;

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      colorThemePreference: 'purple',
      setThemePreference: (themePreference) => set({ themePreference }),
      setColorThemePreference: (colorThemePreference) => set({ colorThemePreference }),
    }),
    {
      name: 'app-treino-preferences',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ colorThemePreference, themePreference }) => ({
        colorThemePreference,
        themePreference,
      }),
      migrate: (persistedState, version): PersistedPreferences => {
        const state = persistedState as Partial<PersistedPreferences>;
        return {
          themePreference: state.themePreference ?? 'system',
          colorThemePreference:
            version < 1 ? 'purple' : (state.colorThemePreference ?? 'purple'),
        };
      },
    },
  ),
);
