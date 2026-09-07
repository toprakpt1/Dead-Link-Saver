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
  it('takes the first three links with titles and dead flags', () => {
    const links = [
      linkAt('https://a.com', { metadata: { title: 'A' }, isDead: true }),
      linkAt('https://b.com'),
      linkAt('https://c.com'),
      linkAt('https://d.com', { isDead: true }),
    ];
    const payload = buildWidgetPayload(links);
    expect(payload.links).toHaveLength(WIDGET_MAX_LINKS);
    expect(payload.links[0]).toMatchObject({ title: 'A', isDead: true });
    expect(payload.deadCount).toBe(2);
    expect(typeof payload.updatedAt).toBe('number');
  });

  it('falls back to the url when a title is missing', () => {
    const payload = buildWidgetPayload([linkAt('https://a.com', { metadata: { title: '' } })]);
    expect(payload.links[0].title).toBe('https://a.com');
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
