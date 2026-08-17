export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const colorPalettes = {
  darkBlue: {
    label: 'Azul escuro',
    primary: '#1D4ED8',
    primaryPressed: '#1E40AF',
  },
  green: {
    label: 'Verde',
    primary: '#067647',
    primaryPressed: '#05603A',
  },
  red: {
    label: 'Vermelho',
    primary: '#B42318',
    primaryPressed: '#912018',
  },
  purple: {
    label: 'Roxo',
    primary: '#5B5FEF',
    primaryPressed: '#4549C9',
  },
} as const;

export type ThemeColorPreference = keyof typeof colorPalettes;
export type ThemeScheme = 'light' | 'dark';

const baseThemes = {
  light: {
    dark: false,
    colors: {
      background: '#F6F7FB',
      surface: '#FFFFFF',
      surfaceMuted: '#ECEEF5',
      text: '#171923',
      textMuted: '#5D6475',
      border: '#D9DDEA',
      onPrimary: '#FFFFFF',
      success: '#067647',
      danger: '#B42318',
      warning: '#B54708',
      warningSurface: '#FFFAEB',
      warningText: '#7A2E0E',
    },
  },
  dark: {
    dark: true,
    colors: {
      background: '#101116',
      surface: '#191B23',
      surfaceMuted: '#252834',
      text: '#F4F5F8',
      textMuted: '#A6ADBD',
      border: '#343846',
      onPrimary: '#FFFFFF',
      success: '#75E0A7',
      danger: '#FDA29B',
      warning: '#FEC84B',
      warningSurface: '#332A16',
      warningText: '#FEC84B',
    },
  },
} as const;

export function createAppTheme(
  scheme: ThemeScheme,
  colorPreference: ThemeColorPreference,
) {
  const baseTheme = baseThemes[scheme];
  const palette = colorPalettes[colorPreference];

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      primaryPressed: palette.primaryPressed,
    },
  };
}

export const themes = {
  light: createAppTheme('light', 'purple'),
  dark: createAppTheme('dark', 'purple'),
} as const;

export type AppTheme = ReturnType<typeof createAppTheme>;
