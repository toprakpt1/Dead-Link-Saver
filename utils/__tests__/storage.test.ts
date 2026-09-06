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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '@/utils/storage';
import type { SavedLink } from '@/store/types';

function makeLink(url: string): SavedLink {
  return {
    id: `id-${url}`,
    url,
    platform: 'unknown',
    category: 'random',
    status: 'unread',
    metadata: { title: url },
    isDead: false,
    isFavorite: false,
    createdAt: 1700000000000,
    openCount: 0,
  };
}

beforeEach(async () => {
  vi.clearAllMocks();
  await asyncStorageMock.clear();
});

describe('storage.saveLinks / loadLinks', () => {
  it('round-trips links through AsyncStorage', async () => {
    const links = [makeLink('https://a.com'), makeLink('https://b.com')];
    await storage.saveLinks(links);
    await expect(storage.loadLinks()).resolves.toEqual(links);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.LINKS)).resolves.toBe(JSON.stringify(links));
  });

  it('loadLinks returns [] when nothing is stored', async () => {
    await expect(storage.loadLinks()).resolves.toEqual([]);
  });

  it('loadLinks returns [] on corrupted json', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await AsyncStorage.setItem(STORAGE_KEYS.LINKS, 'not-json{{{');
    await expect(storage.loadLinks()).resolves.toEqual([]);
    spy.mockRestore();
  });
});

describe('storage.saveSettings / loadSettings', () => {
  it('round-trips settings', async () => {
    await storage.saveSettings({ cardSize: 'large' });
    await expect(storage.loadSettings()).resolves.toEqual({ cardSize: 'large' });
  });

  it('loadSettings returns defaults when nothing is stored', async () => {
    await expect(storage.loadSettings()).resolves.toEqual({ cardSize: 'medium' });
  });

  it('loadSettings returns defaults on corrupted json', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, 'nope');
    await expect(storage.loadSettings()).resolves.toEqual({ cardSize: 'medium' });
    spy.mockRestore();
  });
});

describe('storage.clearAll', () => {
  it('removes the app keys', async () => {
    await storage.saveLinks([makeLink('https://a.com')]);
    await storage.saveSettings({ cardSize: 'small' });
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');

    await storage.clearAll();

    await expect(AsyncStorage.getItem(STORAGE_KEYS.LINKS)).resolves.toBeNull();
    await expect(AsyncStorage.getItem(STORAGE_KEYS.SETTINGS)).resolves.toBeNull();
    await expect(AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING)).resolves.toBeNull();
  });
});