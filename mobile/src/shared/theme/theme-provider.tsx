import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { usePreferencesStore } from '@/shared/stores/preferences.store';

import { type AppTheme, themes } from './tokens';

const ThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const preference = usePreferencesStore((state) => state.themePreference);
  const systemPreference = systemScheme === 'dark' ? 'dark' : 'light';
  const scheme = preference === 'system' ? systemPreference : preference;
  const theme = useMemo(() => themes[scheme], [scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useAppTheme deve ser usado dentro de AppThemeProvider.');
  }

  return theme;
}
