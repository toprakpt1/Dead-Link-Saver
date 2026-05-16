import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedLink, AppSettings, DEFAULT_SETTINGS } from '@/store/types';
import { STORAGE_KEYS } from './constants';

export const storage = {
  async saveLinks(links: SavedLink[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    } catch (error) {
      console.error('Failed to save links:', error);
      throw error;
    }
  },

  async loadLinks(): Promise<SavedLink[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LINKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load links:', error);
      return [];
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LINKS);
      await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  },
};
