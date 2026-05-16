import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, DEFAULT_CATEGORIES } from './types';
import { STORAGE_KEYS } from '@/utils/constants';

const CATEGORY_COLORS = [
  '#10b981', '#f472b6', '#6c8eff', '#f59e0b', '#94a3b8',
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#14b8a6', '#a855f7', '#e11d48', '#0ea5e9',
];

interface CategoryStore {
  categories: Category[];
  loaded: boolean;
  loadCategories: () => Promise<void>;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  getCategory: (id: string) => Category | undefined;
}

function getId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function getNextColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  loaded: false,

  loadCategories: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) {
        set({ categories: JSON.parse(data), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  addCategory: (name: string) => {
    const { categories } = get();
    const id = getId(name);
    if (categories.some((c) => c.id === id)) return;

    const newCategory: Category = {
      id,
      name,
      color: getNextColor(categories.length),
      keywords: [name.toLowerCase()],
    };

    const updated = [...categories, newCategory];
    set({ categories: updated });
    AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
  },

  removeCategory: (id: string) => {
    const { categories } = get();
    if (id === 'random') return; // can't remove default

    const updated = categories.filter((c) => c.id !== id);
    set({ categories: updated });
    AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
  },

  updateCategory: (id: string, data: Partial<Category>) => {
    const { categories } = get();
    const updated = categories.map((c) => (c.id === id ? { ...c, ...data } : c));
    set({ categories: updated });
    AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
  },

  getCategory: (id: string) => {
    return get().categories.find((c) => c.id === id);
  },
}));
