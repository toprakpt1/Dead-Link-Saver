import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedLink } from '@/store/types';

const fileSystemMock = vi.hoisted(() => ({
  documentDirectory: 'file:///data/user/0/com.deadlinksaver.app/files/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: vi.fn(async (_uri: string, _contents: string, _options?: unknown) => {}),
}));

vi.mock('expo-file-system/legacy', () => ({ default: fileSystemMock, ...fileSystemMock }));

import { buildWidgetPayload, syncWidgetData, WIDGET_MAX_LINKS } from '@/services/widgetSync';

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

describe('buildWidgetPayload', () => {
  it('orders dead links first and caps at five rows', () => {
    const links = [
      linkAt('https://a.com', { metadata: { title: 'A' } }),
      linkAt('https://b.com', { metadata: { title: 'B' }, isDead: true }),
      linkAt('https://c.com'),
      linkAt('https://d.com', { isDead: true }),
      linkAt('https://e.com'),
      linkAt('https://f.com'),
      linkAt('https://g.com', { isDead: true }),
    ];
    const payload = buildWidgetPayload(links);
    expect(payload.links).toHaveLength(WIDGET_MAX_LINKS);
    expect(payload.links.slice(0, 3).every((l) => l.isDead)).toBe(true);
    expect(payload.links[3].isDead).toBe(false);
    expect(payload.deadCount).toBe(3);
    expect(payload.totalCount).toBe(7);
  });

  it('reports unread counts over the full list', () => {
    const links = [
      linkAt('https://a.com', { status: 'unread' }),
      linkAt('https://b.com', { status: 'watched' }),
      linkAt('https://c.com', { status: 'saved' }),
    ];
    const payload = buildWidgetPayload(links);
    expect(payload.unreadCount).toBe(1);
    expect(payload.totalCount).toBe(3);
  });

  it('falls back to the url when a title is missing and passes favorites through', () => {
    const payload = buildWidgetPayload([linkAt('https://a.com', { metadata: { title: '' }, isFavorite: true })]);
    expect(payload.links[0].title).toBe('https://a.com');
    expect(payload.links[0].isFavorite).toBe(true);
  });
});
describe('syncWidgetData', () => {
  it('writes the payload file and skips unchanged links', async () => {
    const links = [linkAt('https://a.com')];
    await syncWidgetData(links);
    expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalledTimes(1);
    const [uri, body] = fileSystemMock.writeAsStringAsync.mock.calls[0] as [string, string];
    expect(uri).toBe('file:///data/user/0/com.deadlinksaver.app/files/widget-data.json');
    expect(JSON.parse(body).links).toHaveLength(1);

    await syncWidgetData(links);
    expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalledTimes(1);
  });

  it('rewrites when the list changes', async () => {
    await syncWidgetData([linkAt('https://fresh-a.com')]);
    await syncWidgetData([linkAt('https://fresh-a.com'), linkAt('https://fresh-b.com')]);
    expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalledTimes(2);
  });
});
