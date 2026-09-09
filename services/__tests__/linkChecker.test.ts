import { afterEach, describe, it, expect, vi } from 'vitest';
import { checkLinkStatus, checkMultipleLinks, appendCheck, MAX_LINK_CHECKS } from '@/services/linkChecker';
import type { SavedLink } from '@/store/types';

function headResponse(status: number) {
  return { ok: status >= 200 && status < 300, status };
}

function archiveResponse(snapshotUrl?: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      archived_snapshots: snapshotUrl ? { closest: { url: snapshotUrl } } : {},
    }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('checkLinkStatus', () => {
  it('marks 2xx responses as alive', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(headResponse(200)));
    await expect(checkLinkStatus('https://example.com/ok')).resolves.toEqual({ isDead: false, statusCode: 200 });
  });

  it('marks 404 as dead only after GET confirms, and fetches an archive url', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headResponse(404))
      .mockResolvedValueOnce(headResponse(404))
      .mockResolvedValueOnce(archiveResponse('https://web.archive.org/web/20240101/https://example.com/gone'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(checkLinkStatus('https://example.com/gone')).resolves.toEqual({
      isDead: true,
      archiveUrl: 'https://web.archive.org/web/20240101/https://example.com/gone',
      statusCode: 404,
    });
    expect(fetchMock.mock.calls[1][1]?.method).toBe('GET');
  });

  it('treats a HEAD 404 overruled by a GET wall as alive', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headResponse(404))
      .mockResolvedValueOnce(headResponse(403));
    vi.stubGlobal('fetch', fetchMock);
    await expect(checkLinkStatus('https://example.com/walled')).resolves.toEqual({
      isDead: false,
      statusCode: 403,
    });
  });

  it('falls back to GET when HEAD is rejected or walled', async () => {
    for (const headStatus of [403, 405, 429]) {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(headResponse(headStatus))
        .mockResolvedValueOnce(headResponse(200));
      vi.stubGlobal('fetch', fetchMock);
      await expect(checkLinkStatus('https://example.com/alive')).resolves.toEqual({
        isDead: false,
        statusCode: 200,
      });
      expect(fetchMock.mock.calls[1][1]?.method).toBe('GET');
    }
  });

  it('confirms a 5xx HEAD with GET before marking dead', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headResponse(503))
      .mockResolvedValueOnce(headResponse(503))
      .mockResolvedValueOnce(archiveResponse());
    vi.stubGlobal('fetch', fetchMock);
    const result = await checkLinkStatus('https://example.com/down');
    expect(result.isDead).toBe(true);
    expect(result.statusCode).toBe(503);
  });

  it('treats a HEAD 503 overruled by a GET wall as alive', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headResponse(503))
      .mockResolvedValueOnce(headResponse(200));
    vi.stubGlobal('fetch', fetchMock);
    await expect(checkLinkStatus('https://example.com/flaky')).resolves.toEqual({
      isDead: false,
      statusCode: 200,
    });
  });

  it('falls back to the search url when the archive lookup fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headResponse(404))
      .mockResolvedValueOnce(headResponse(404))
      .mockRejectedValueOnce(new Error('archive api down'));
    await expect(checkLinkStatus('https://example.com/gone')).resolves.toEqual({
      isDead: true,
      archiveUrl: 'https://web.archive.org/web/*/https://example.com/gone',
      statusCode: 404,
    });
  });

  it('assumes the link is alive when the check itself fails', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    await expect(checkLinkStatus('https://example.com/x')).resolves.toEqual({ isDead: false });
    vi.runAllTimers(); // flush the 10s abort timeout
  });

  it('uses HEAD requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(headResponse(200));
    vi.stubGlobal('fetch', fetchMock);
    await checkLinkStatus('https://example.com/ok');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('HEAD');
  });
});

describe('checkMultipleLinks', () => {
  it('checks urls in batches and reports progress', async () => {
    const fetchMock = vi.fn().mockResolvedValue(headResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}`);
    const progress: Array<[number, number]> = [];
    const results = await checkMultipleLinks(urls, (checked, total) => {
      progress.push([checked, total]);
    });

    expect(results.size).toBe(6);
    for (const [url, status] of results) {
      expect(url).toMatch(/^https:\/\/example\.com\//);
      expect(status.isDead).toBe(false);
    }
    expect(progress).toEqual([
      [5, 6],
      [6, 6],
    ]);
  });

  it('collects dead urls with archive urls', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(headResponse(200))
      .mockResolvedValueOnce(headResponse(404))
      .mockResolvedValueOnce(headResponse(404))
      .mockResolvedValueOnce(archiveResponse('https://web.archive.org/web/20240101/https://example.com/gone'));
    vi.stubGlobal('fetch', fetchMock);

    const results = await checkMultipleLinks([
      'https://example.com/alive',
      'https://example.com/gone',
    ]);

    expect(results.get('https://example.com/alive')).toEqual({ isDead: false, statusCode: 200 });
    expect(results.get('https://example.com/gone')).toEqual({
      isDead: true,
      archiveUrl: 'https://web.archive.org/web/20240101/https://example.com/gone',
      statusCode: 404,
    });
  });
});

describe('appendCheck', () => {
  const base: SavedLink = {
    id: 'x', url: 'https://x.com', platform: 'unknown', category: 'random', status: 'unread',
    metadata: { title: 'x' }, isDead: false, isFavorite: false, createdAt: 1, openCount: 0,
  };

  it('appends entries and caps history at the limit', () => {
    let link = { ...base };
    for (let i = 0; i < MAX_LINK_CHECKS + 5; i++) {
      link = appendCheck(link, 'alive', 200, i);
    }
    expect(link.checks).toHaveLength(MAX_LINK_CHECKS);
    expect(link.checks?.[0]).toEqual({ checkedAt: 5, status: 'alive', statusCode: 200 });
  });

  it('omits statusCode when the check never got a response', () => {
    const next = appendCheck({ ...base }, 'error');
    expect(next.checks).toEqual([{ checkedAt: expect.any(Number), status: 'error' }]);
  });
});