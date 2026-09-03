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
      background: '#0a0e27',
      surface: '#151b3d',
      surfaceHover: '#1e254d',
      primary: '#6c8eff',
      primaryMuted: 'rgba(108,142,255,0.12)',
      secondary: '#a78bfa',
      accent: '#f472b6',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
      textSubtle: '#64748b',
      border: '#1e293b',
      borderStrong: '#334155',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      overlay: 'rgba(0,0,0,0.6)',
      onPrimary: '#ffffff',
    },
  },
  paper: {
    id: 'paper',
    name: 'Paper',
    isDark: false,
    colors: {
      background: '#f8f7f4',
      surface: '#ffffff',
      surfaceHover: '#f1f5f9',
      primary: '#0f766e',
      primaryMuted: 'rgba(15,118,110,0.08)',
      secondary: '#475569',
      accent: '#c2410c',
      text: '#0f172a',
      textMuted: '#64748b',
      textSubtle: '#94a3b8',
      border: '#e2e8f0',
      borderStrong: '#cbd5e1',
      error: '#dc2626',
      success: '#059669',
      warning: '#d97706',
      overlay: 'rgba(15,23,42,0.4)',
      onPrimary: '#ffffff',
    },
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite',
    isDark: true,
    colors: {
      background: '#0f0f0f',
      surface: '#1c1c1e',
      surfaceHover: '#27272a',
      primary: '#818cf8',
      primaryMuted: 'rgba(129,140,248,0.12)',
      secondary: '#a1a1aa',
      accent: '#fb7185',
      text: '#fafafa',
      textMuted: '#a1a1aa',
      textSubtle: '#71717a',
      border: '#27272a',
      borderStrong: '#3f3f46',
      error: '#f87171',
      success: '#4ade80',
      warning: '#fbbf24',
      overlay: 'rgba(0,0,0,0.6)',
      onPrimary: '#0f0f0f',
    },
  },
};

export const themeIds: ThemeId[] = ['midnight', 'paper', 'graphite'];

// Keep legacy COLORS for one-release compat, but new code must use useTheme().colors
export const LEGACY_COLORS = themes.midnight.colors;
