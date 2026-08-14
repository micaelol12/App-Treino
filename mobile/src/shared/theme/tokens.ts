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
  success: '#15803D',
  danger: '#DC2626',
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
      textMuted: '#667085',
      border: '#D9DDEA',
      onPrimary: '#FFFFFF',
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
    },
  },
} as const;

export type AppTheme = (typeof themes)[keyof typeof themes];
