export type ThemeId = 'midnight' | 'paper' | 'graphite';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  primaryMuted: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  borderStrong: string;
  error: string;
  success: string;
  warning: string;
  overlay: string;
  onPrimary: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const themes: Record<ThemeId, Theme> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    isDark: true,
    colors: {
      background: '#171310',
      surface: '#221c15',
      surfaceHover: '#2e2620',
      primary: '#f59e0b',
      primaryMuted: 'rgba(245,158,11,0.14)',
      secondary: '#fbbf24',
      accent: '#60a5fa',
      text: '#fffbeb',
      textMuted: '#c9bfae',
      textSubtle: '#8a8178',
      border: '#3a3128',
      borderStrong: '#57534a',
      error: '#f87171',
      success: '#34d399',
      warning: '#fbbf24',
      overlay: 'rgba(0,0,0,0.6)',
      onPrimary: '#1c1917',
    },
  },
  paper: {
    id: 'paper',
    name: 'Paper',
    isDark: false,
    colors: {
      background: '#fffbeb',
      surface: '#ffffff',
      surfaceHover: '#fcf6f0',
      primary: '#d97706',
      primaryMuted: 'rgba(217,119,6,0.10)',
      secondary: '#f59e0b',
      accent: '#2563eb',
      text: '#0f172a',
      textMuted: '#57534c',
      textSubtle: '#a8a29e',
      border: '#f3e2c7',
      borderStrong: '#d9c0a0',
      error: '#dc2626',
      success: '#059669',
      warning: '#b45309',
      overlay: 'rgba(28,25,23,0.45)',
      onPrimary: '#ffffff',
    },
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite',
    isDark: true,
    colors: {
      background: '#1c1917',
      surface: '#292524',
      surfaceHover: '#3a3532',
      primary: '#fbbf24',
      primaryMuted: 'rgba(251,191,36,0.14)',
      secondary: '#fcd34a',
      accent: '#60a5fa',
      text: '#fafaf9',
      textMuted: '#a8a29e',
      textSubtle: '#78716c',
      border: '#44403c',
      borderStrong: '#57534a',
      error: '#f87171',
      success: '#4ade80',
      warning: '#fbbf24',
      overlay: 'rgba(0,0,0,0.6)',
      onPrimary: '#1c1917',
    },
  },
};

export const themeIds: ThemeId[] = ['midnight', 'paper', 'graphite'];

// Keep legacy COLORS for one-release compat, but new code must use useTheme().colors
export const LEGACY_COLORS = themes.midnight.colors;
