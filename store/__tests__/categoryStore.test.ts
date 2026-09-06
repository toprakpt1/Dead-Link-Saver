import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/utils/constants';

const asyncStorageMock = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn(async (key: string) => { store.delete(key); }),
    clear: vi.fn(async () => { store.clear(); }),
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));

import { useCategoryStore } from '@/store/categoryStore';
import { DEFAULT_CATEGORIES } from '@/store/types';

beforeEach(async () => {
  vi.clearAllMocks();
  await asyncStorageMock.clear();
  useCategoryStore.setState({ categories: DEFAULT_CATEGORIES, loaded: false });
});

describe('addCategory', () => {
  it('adds a category with a slug id derived from the name', () => {
    useCategoryStore.getState().addCategory('My Cool Category');
    const added = useCategoryStore.getState().categories.find((c) => c.id === 'my-cool-category');
    expect(added?.name).toBe('My Cool Category');
    expect(added?.color).toBeTypeOf('string');
    expect(added?.keywords).toEqual(['my cool category']);
  });

  it('does not add duplicate ids', () => {
    const before = useCategoryStore.getState().categories.length;
    useCategoryStore.getState().addCategory('Education');
    useCategoryStore.getState().addCategory('Education');
    expect(useCategoryStore.getState().categories.length).toBe(before);
  });

  it('persists to storage', async () => {
    useCategoryStore.getState().addCategory('Gaming');
    const raw = await asyncStorageMock.getItem(STORAGE_KEYS.CATEGORIES);
    expect(JSON.parse(raw ?? '[]')).toHaveLength(
      useCategoryStore.getState().categories.length
    );
  });
});

describe('removeCategory', () => {
  it('removes a custom category', () => {
    useCategoryStore.getState().addCategory('Gaming');
    useCategoryStore.getState().removeCategory('gaming');
    expect(useCategoryStore.getState().categories.some((c) => c.id === 'gaming')).toBe(false);
  });

  it('refuses to remove the default random category', () => {
    const before = useCategoryStore.getState().categories;
    useCategoryStore.getState().removeCategory('random');
    expect(useCategoryStore.getState().categories).toEqual(before);
  });
});

describe('updateCategory', () => {
  it('merges partial updates', () => {
    useCategoryStore.getState().updateCategory('education', { color: '#ff0000' });
    const updated = useCategoryStore.getState().categories.find((c) => c.id === 'education');
    expect(updated?.color).toBe('#ff0000');
    expect(updated?.name).toBe('Education');
  });
});

describe('getCategory', () => {
  it('finds a category by id', () => {
    expect(useCategoryStore.getState().getCategory('code')?.name).toBe('Code');
    expect(useCategoryStore.getState().getCategory('nope')).toBeUndefined();
  });
});

describe('loadCategories', () => {
  it('loads stored categories', async () => {
    await asyncStorageMock.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify([{ id: 'custom', name: 'Custom', color: '#111111', keywords: [] }])
    );
    await useCategoryStore.getState().loadCategories();
    expect(useCategoryStore.getState().categories).toEqual([
      { id: 'custom', name: 'Custom', color: '#111111', keywords: [] },
    ]);
    expect(useCategoryStore.getState().loaded).toBe(true);
  });

  it('keeps defaults when nothing is stored', async () => {
    await useCategoryStore.getState().loadCategories();
    expect(useCategoryStore.getState().loaded).toBe(true);
    expect(useCategoryStore.getState().categories.length).toBeGreaterThan(0);
  });
});