import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedLink } from '@/store/types';

vi.mock('expo-background-fetch', () => ({
  registerTaskAsync: vi.fn(async () => {}),
  BackgroundFetchResult: { NewData: 'new', Failed: 'failed' },
}));

vi.mock('expo-task-manager', () => ({
  defineTask: vi.fn(),
  isTaskRegisteredAsync: vi.fn(async () => false),
}));

const notifyMock = vi.hoisted(() => vi.fn(async (_title: string, _body: string) => {}));
vi.mock('@/services/notifications', () => ({ notifyDeadLinks: notifyMock }));

const checkMock = vi.hoisted(() => vi.fn(async (_urls: string[]) => new Map()));
vi.mock('@/services/linkChecker', () => ({ checkMultipleLinks: checkMock, appendCheck: (link: SavedLink) => link }));
const storageMock = vi.hoisted(() => ({
  saveLinks: vi.fn(async (_links: SavedLink[]) => {}),
  loadLinks: vi.fn(async (): Promise<SavedLink[]> => []),
}));
vi.mock('@/utils/storage', () => ({ storage: storageMock }));

vi.mock('@/utils/i18n', () => ({
  default: { t: (key: string) => key },
  initI18n: vi.fn(async () => {}),
}));

import { performBackgroundScan } from '@/services/backgroundScan';

function linkAt(url: string, overrides: Partial<SavedLink> = {}): SavedLink {
  return {
    id: `id-${url}`,
    url,
    platform: 'unknown',
    category: 'random',
    status: 'unread',
    metadata: { title: url },
    isDead: false,
    isFavorite: false,
    createdAt: Date.now(),
    openCount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('performBackgroundScan', () => {
  it('does nothing when there are no links', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([]);
    const result = await performBackgroundScan();
    expect(result).toEqual({ checked: 0, dead: 0 });
    expect(notifyMock).not.toHaveBeenCalled();
    expect(storageMock.saveLinks).not.toHaveBeenCalled();
  });

  it('marks newly-dead links and notifies once', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([
      linkAt('https://alive.example.com'),
      linkAt('https://dead.example.com'),
    ]);
    checkMock.mockResolvedValueOnce(
      new Map([
        ['https://alive.example.com', { isDead: false }],
        ['https://dead.example.com', { isDead: true, archiveUrl: 'https://web.archive.org/x' }],
      ])
    );
    const result = await performBackgroundScan();
    expect(result).toEqual({ checked: 2, dead: 1 });
    const saved = storageMock.saveLinks.mock.calls[0][0] as SavedLink[];
    expect(saved.find((l) => l.url === 'https://dead.example.com')?.isDead).toBe(true);
    expect(saved.find((l) => l.url === 'https://alive.example.com')?.isDead).toBe(false);
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it('stays silent when nothing newly died', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([
      linkAt('https://old-dead.example.com', { isDead: true }),
    ]);
    checkMock.mockResolvedValueOnce(
      new Map([['https://old-dead.example.com', { isDead: true }]])
    );
    const result = await performBackgroundScan();
    expect(result).toEqual({ checked: 1, dead: 0 });
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
