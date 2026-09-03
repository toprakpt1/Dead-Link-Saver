import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';
import { themes, type ThemeId, type Theme } from '@/theme/themes';

const THEME_KEY = STORAGE_KEYS.THEME ?? '@dead_link_saver:theme';

interface ThemeStore {
  themeId: ThemeId;
  loaded: boolean;
  theme: Theme;
  loadTheme: () => Promise<void>;
  setTheme: (id: ThemeId) => Promise<void>;
}

function resolveTheme(id: string | null): ThemeId {
  if (id === 'midnight' || id === 'paper' || id === 'graphite') return id;
  return 'midnight';
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeId: 'midnight',
  loaded: false,
  theme: themes.midnight,

  loadTheme: async () => {
    try {
      const raw = await AsyncStorage.getItem(THEME_KEY);
      const id = resolveTheme(raw);
      set({ themeId: id, theme: themes[id], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setTheme: async (id: ThemeId) => {
    set({ themeId: id, theme: themes[id] });
    await AsyncStorage.setItem(THEME_KEY, id);
  },
}));

// Hook for components: keeps backwards compat with old COLORS import pattern
export function useTheme() {
  const { theme, themeId, setTheme, loaded } = useThemeStore();
  return { theme, colors: theme.colors, themeId, setTheme, loaded, isDark: theme.isDark };
}
