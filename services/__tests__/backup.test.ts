import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedLink } from '@/store/types';
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

const fileSystemMock = vi.hoisted(() => ({
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///doc/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: vi.fn(async (_uri: string, _contents: string, _options?: unknown) => {}),
  readAsStringAsync: vi.fn(async (_uri: string) => '{}'),
}));

const documentPickerMock = vi.hoisted(() => ({
  getDocumentAsync: vi.fn(
    async (): Promise<{ canceled: boolean; assets?: Array<{ uri: string }> }> => ({ canceled: true })
  ),
}));

const sharingMock = vi.hoisted(() => ({
  isAvailableAsync: vi.fn(async (): Promise<boolean> => true),
  shareAsync: vi.fn(async (_uri: string, _options?: unknown) => {}),
}));

const storageMock = vi.hoisted(() => ({
  saveLinks: vi.fn(async (_links: SavedLink[]) => {}),
  loadLinks: vi.fn(async (): Promise<SavedLink[]> => []),
  saveSettings: vi.fn(async (_settings: unknown) => {}),
  loadSettings: vi.fn(async (): Promise<unknown> => ({ cardSize: 'medium' })),
  clearAll: vi.fn(async () => {}),
}));

const rnMock = vi.hoisted(() => ({
  Platform: { OS: 'android' },
  Alert: { alert: vi.fn() },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));
vi.mock('expo-file-system/legacy', () => ({ default: fileSystemMock, ...fileSystemMock }));
vi.mock('expo-document-picker', () => ({ default: documentPickerMock, ...documentPickerMock }));
vi.mock('expo-sharing', () => ({ default: sharingMock, ...sharingMock }));
vi.mock('react-native', () => rnMock);
vi.mock('@/utils/storage', () => ({ storage: storageMock }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBackupFile, pickAndRestoreBackup, shareBackup } from '@/services/backup';

function makeLink(url: string, overrides: Partial<SavedLink> = {}): SavedLink {
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
    ...overrides,
  };
}

beforeEach(async () => {
  vi.clearAllMocks();
  await asyncStorageMock.clear();
});

describe('createBackupFile', () => {
  it('writes a json backup with links and categories', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([makeLink('https://a.com')]);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify([{ id: 'news', name: 'News', color: '#000', keywords: [] }])
    );

    const uri = await createBackupFile();

    expect(uri).toMatch(/^file:\/\/\/cache\/dead-link-saver-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalledTimes(1);

    const written = fileSystemMock.writeAsStringAsync.mock.calls[0][1] as string;
    const payload = JSON.parse(written);
    expect(payload.version).toBe(1);
    expect(payload.links).toHaveLength(1);
    expect(payload.links[0].url).toBe('https://a.com');
    expect(payload.categories).toEqual([
      { id: 'news', name: 'News', color: '#000', keywords: [] },
    ]);
    expect(typeof payload.exportedAt).toBe('number');
  });

  it('writes an empty categories list when nothing is stored', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([]);
    await createBackupFile();
    const written = fileSystemMock.writeAsStringAsync.mock.calls[0][1] as string;
    expect(JSON.parse(written).categories).toEqual([]);
  });
});

describe('pickAndRestoreBackup', () => {
  it('returns zeros when the picker is canceled', async () => {
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({ canceled: true });
    await expect(pickAndRestoreBackup()).resolves.toEqual({ imported: 0, skipped: 0 });
    expect(storageMock.saveLinks).not.toHaveBeenCalled();
  });

  it('throws on invalid json', async () => {
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///x.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce('this is not json');
    await expect(pickAndRestoreBackup()).rejects.toThrow('Geçersiz yedek dosyası');
  });

  it('throws on a payload without links', async () => {
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///x.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(JSON.stringify({ foo: 1 }));
    await expect(pickAndRestoreBackup()).rejects.toThrow('Yedek formatı hatalı');
  });

  it('imports new links and skips duplicates and malformed entries', async () => {
    const existing = [makeLink('https://a.com')];
    storageMock.loadLinks.mockResolvedValueOnce(existing);

    const incoming = [
      makeLink('https://b.com'),
      makeLink('https://a.com'), // already saved
      { foo: 'bar' }, // malformed
      'just a string', // malformed
    ];
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///x.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(
      JSON.stringify({ version: 1, exportedAt: 1, links: incoming, categories: [] })
    );

    await expect(pickAndRestoreBackup()).resolves.toEqual({ imported: 1, skipped: 3 });
    expect(storageMock.saveLinks).toHaveBeenCalledTimes(1);
    const saved = storageMock.saveLinks.mock.calls[0][0] as SavedLink[];
    expect(saved).toHaveLength(2);
    expect(saved.map((l) => l.url)).toEqual(['https://a.com', 'https://b.com']);
  });

  it('does not save when nothing was imported', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([makeLink('https://a.com')]);
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///x.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        exportedAt: 1,
        links: [makeLink('https://a.com')],
        categories: [],
      })
    );

    await expect(pickAndRestoreBackup()).resolves.toEqual({ imported: 0, skipped: 1 });
    expect(storageMock.saveLinks).not.toHaveBeenCalled();
  });

  it('regenerates ids that collide with existing links', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([makeLink('https://a.com', { id: 'shared-id' })]);
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///x.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        exportedAt: 1,
        links: [makeLink('https://b.com', { id: 'shared-id' })],
        categories: [],
      })
    );

    await pickAndRestoreBackup();
    const saved = storageMock.saveLinks.mock.calls[0][0] as SavedLink[];
    const imported = saved.find((l) => l.url === 'https://b.com');
    expect(imported?.id).not.toBe('shared-id');
  });

  it('merges new categories while keeping existing ones', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([]);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify([{ id: 'news', name: 'News', color: '#000', keywords: [] }])
    );

    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///x.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        exportedAt: 1,
        links: [makeLink('https://new.com')],
        categories: [
          { id: 'news', name: 'News', color: '#000', keywords: [] }, // duplicate, skipped
          { id: 'gaming', name: 'Gaming', color: '#123456', keywords: ['game'] },
        ],
      })
    );

    await pickAndRestoreBackup();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const stored = JSON.parse(raw ?? '[]') as Array<{ id: string }>;
    expect(stored.map((c) => c.id).sort()).toEqual(['gaming', 'news']);
  });
});

describe('shareBackup', () => {
  it('shows an alert on android when sharing is unavailable', async () => {
    sharingMock.isAvailableAsync.mockResolvedValueOnce(false);
    storageMock.loadLinks.mockResolvedValueOnce([]);
    await shareBackup();
    expect(rnMock.Alert.alert).toHaveBeenCalled();
    expect(sharingMock.shareAsync).not.toHaveBeenCalled();
  });

  it('shares the backup file when sharing is available', async () => {
    sharingMock.isAvailableAsync.mockResolvedValueOnce(true);
    storageMock.loadLinks.mockResolvedValueOnce([]);
    await shareBackup();
    expect(sharingMock.shareAsync).toHaveBeenCalledTimes(1);
    expect(sharingMock.shareAsync.mock.calls[0][1]).toMatchObject({
      mimeType: 'application/json',
    });
  });
});