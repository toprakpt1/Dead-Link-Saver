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
import { createBackupFile, pickAndRestoreBackup, shareBackup, buildMarkdownExport, buildCsvExport, buildHtmlExport, createExportFile, parseBookmarkHtml, bookmarkToSavedLink } from '@/services/backup';

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
    await expect(pickAndRestoreBackup()).rejects.toThrow('INVALID_BACKUP_FILE');
  });

  it('throws on a payload without links', async () => {
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///x.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(JSON.stringify({ foo: 1 }));
    await expect(pickAndRestoreBackup()).rejects.toThrow('INVALID_BACKUP_SHAPE');
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

describe('bookmark html import', () => {
  const POCKET_HTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Bookmarks</TITLE><H1>Bookmarks</H1>
<DL><p>
<DT><A HREF="https://example.com/article" ADD_DATE="1700000000" TAGS="reading">Great Article</A>
<DT><A HREF="https://youtu.be/dQw4w9WgXcQ">Video</A>
<DT><A HREF="javascript:void(0)">Not a link</A>
<DT><A HREF="https://example.com/article">Duplicate</A>
</DL><p>`;

  it('parses Pocket-style anchor exports and skips non-links', () => {
    const parsed = parseBookmarkHtml(POCKET_HTML);
    expect(parsed.map((b) => b.url)).toEqual([
      'https://example.com/article',
      'https://youtu.be/dQw4w9WgXcQ',
    ]);
    expect(parsed[0].title).toBe('Great Article');
    expect(parsed[0].addedAt).toBe(1700000000 * 1000);
  });

  it('builds savable links with detected platforms', () => {
    const link = bookmarkToSavedLink({ url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Video' }, 42);
    expect(link.platform).toBe('youtube');
    expect(link.metadata.title).toBe('Video');
    expect(link.status).toBe('unread');
    expect(link.openCount).toBe(0);
  });

  it('restores links from a bookmark file picked in the importer', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([makeLink('https://example.com/article')]);
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///pocket.html' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(POCKET_HTML);

    await expect(pickAndRestoreBackup()).resolves.toEqual({ imported: 1, skipped: 1 });
    const saved = storageMock.saveLinks.mock.calls[0][0] as SavedLink[];
    expect(saved.map((l) => l.url).sort()).toEqual(
      ['https://example.com/article', 'https://youtu.be/dQw4w9WgXcQ'].sort()
    );
    expect(saved.find((l) => l.url === 'https://youtu.be/dQw4w9WgXcQ')?.platform).toBe('youtube');
  });
});

describe('shareBackup', () => {
  const STRINGS = {
    dialogTitle: 'dlg',
    unavailableTitle: 'no-share',
    unavailableMessage: (p: string) => `saved:${p}`,
  };

  it('shows an alert on android when sharing is unavailable', async () => {
    sharingMock.isAvailableAsync.mockResolvedValueOnce(false);
    storageMock.loadLinks.mockResolvedValueOnce([]);
    await shareBackup(STRINGS);
    expect(rnMock.Alert.alert).toHaveBeenCalledWith('no-share', expect.stringContaining('saved:'));
    expect(sharingMock.shareAsync).not.toHaveBeenCalled();
  });

  it('shares the backup file when sharing is available', async () => {
    sharingMock.isAvailableAsync.mockResolvedValueOnce(true);
    storageMock.loadLinks.mockResolvedValueOnce([]);
    await shareBackup(STRINGS);
    expect(sharingMock.shareAsync).toHaveBeenCalledTimes(1);
    expect(sharingMock.shareAsync.mock.calls[0][1]).toMatchObject({
      mimeType: 'application/json',
      dialogTitle: 'dlg',
    });
  });
});

describe('export builders', () => {
  const cats = [{ id: 'news', name: 'News', color: '#000', keywords: [] }];

  it('groups markdown by category with dead/favorite flags', () => {
    const md = buildMarkdownExport(
      [
        makeLink('https://a.com', { category: 'news', metadata: { title: 'A' } }),
        makeLink('https://b.com', { isDead: true, archiveUrl: 'https://web.archive.org/b', isFavorite: true, metadata: { title: 'B' } }),
      ],
      cats
    );
    expect(md).toContain('## News (1)');
    expect(md).toContain('- [A](https://a.com)');
    expect(md).toContain('- [B](https://b.com) (dead, archive: https://web.archive.org/b, favorite)');
  });

  it('emits a csv with header and escaped cells', () => {
    const csv = buildCsvExport([
      makeLink('https://a.com', { metadata: { title: 'Say "hi", now' }, isDead: true }),
    ]);
    const [header, row] = csv.split('\n');
    expect(header).toBe('title,url,platform,category,status,isDead,archiveUrl,isFavorite,createdAt,openCount');
    expect(row).toContain('"Say ""hi"", now"');
    expect(row).toContain('true');
  });

  it('escapes html and marks dead links', () => {
    const html = buildHtmlExport(
      [makeLink('https://a.com', { metadata: { title: '<b>A</b>' }, isDead: true })],
      cats
    );
    expect(html).toContain('&lt;b&gt;A&lt;/b&gt;');
    expect(html).toContain('class="badge dead"');
    expect(html).not.toContain('<b>A</b>');
  });

  it('writes a markdown file with the right extension', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([makeLink('https://a.com')]);
    const uri = await createExportFile('markdown');
    expect(uri).toMatch(/\.md$/);
    const written = fileSystemMock.writeAsStringAsync.mock.calls[0][1] as string;
    expect(written).toContain('# Dead Link Saver Export');
  });

  it('includes collections in the json backup', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([]);
    await AsyncStorage.setItem(
      STORAGE_KEYS.COLLECTIONS,
      JSON.stringify([{ id: 'c1', name: 'Thesis', linkIds: [], createdAt: 1 }])
    );
    await createBackupFile();
    const written = fileSystemMock.writeAsStringAsync.mock.calls[0][1] as string;
    expect(JSON.parse(written).collections).toEqual([
      { id: 'c1', name: 'Thesis', linkIds: [], createdAt: 1 },
    ]);
  });

  it('merges collections on restore without duplicating ids', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.COLLECTIONS,
      JSON.stringify([{ id: 'c1', name: 'Thesis', linkIds: [], createdAt: 1 }])
    );
    documentPickerMock.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///backup.json' }],
    });
    fileSystemMock.readAsStringAsync.mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        exportedAt: 1,
        links: [],
        categories: [],
        collections: [
          { id: 'c1', name: 'Thesis', linkIds: [], createdAt: 1 },
          { id: 'c2', name: 'Watchlist', linkIds: [], createdAt: 2 },
        ],
      })
    );
    await pickAndRestoreBackup();
    const raw = await asyncStorageMock.getItem(STORAGE_KEYS.COLLECTIONS);
    const stored = JSON.parse(raw ?? '[]') as Array<{ id: string }>;
    expect(stored.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });
});