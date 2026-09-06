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
vi.mock('expo-localization', () => ({
  getLocales: vi.fn(() => [{ languageCode: 'en' }]),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(async () => {
  vi.clearAllMocks();
  await asyncStorageMock.clear();
  // reset the module so the internal `initialized` flag starts fresh per test
  vi.resetModules();
});

describe('initI18n', () => {
  it('initializes with the saved locale when valid', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.LOCALE, 'tr');
    const { initI18n, default: i18n } = await import('@/utils/i18n');
    await initI18n();
    expect(i18n.language).toBe('tr');
  });

  it('falls back to the device locale when nothing is saved', async () => {
    const { initI18n, default: i18n } = await import('@/utils/i18n');
    await initI18n();
    expect(i18n.language).toBe('en');
  });

  it('falls back to english for an unsupported saved locale', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.LOCALE, 'fr');
    const { initI18n, default: i18n } = await import('@/utils/i18n');
    await initI18n();
    expect(i18n.language).toBe('en');
  });

  it('only initializes once', async () => {
    const { initI18n, default: i18n } = await import('@/utils/i18n');
    await initI18n();
    const spy = vi.spyOn(i18n, 'init');
    await initI18n();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('changeLocale', () => {
  it('switches the language and persists the choice', async () => {
    const { initI18n, changeLocale, default: i18n } = await import('@/utils/i18n');
    await initI18n();
    await changeLocale('tr');
    expect(i18n.language).toBe('tr');
    await expect(AsyncStorage.getItem(STORAGE_KEYS.LOCALE)).resolves.toBe('tr');
  });
});

describe('getSavedLocale', () => {
  it('returns null when nothing is saved', async () => {
    const { getSavedLocale } = await import('@/utils/i18n');
    await expect(getSavedLocale()).resolves.toBeNull();
  });

  it('returns the saved locale when supported', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.LOCALE, 'tr');
    const { getSavedLocale } = await import('@/utils/i18n');
    await expect(getSavedLocale()).resolves.toBe('tr');
  });

  it('returns null for an unsupported saved locale', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.LOCALE, 'de');
    const { getSavedLocale } = await import('@/utils/i18n');
    await expect(getSavedLocale()).resolves.toBeNull();
  });
});