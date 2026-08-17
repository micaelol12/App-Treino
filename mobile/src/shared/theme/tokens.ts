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

const common = {
  primary: '#5B5FEF',
  primaryPressed: '#4549C9',
} as const;

export const themes = {
  light: {
    dark: false,
    colors: {
      ...common,
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
      ...common,
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

export type AppTheme = (typeof themes)[keyof typeof themes];
