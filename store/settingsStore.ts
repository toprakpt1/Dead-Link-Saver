import { create } from 'zustand';
import { CardSize } from './types';
import { storage } from '@/utils/storage';

interface SettingsStore {
  cardSize: CardSize;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  setCardSize: (size: CardSize) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  cardSize: 'medium',
  loaded: false,

  loadSettings: async () => {
    const settings = await storage.loadSettings();
    set({ cardSize: settings.cardSize, loaded: true });
  },

  setCardSize: (cardSize: CardSize) => {
    set({ cardSize });
    storage.saveSettings({ cardSize });
  },
}));
