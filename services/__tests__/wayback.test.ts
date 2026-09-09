import { afterEach, describe, it, expect, vi } from 'vitest';
import { saveToWayback, looksLikeWaybackSnapshot } from '@/services/wayback';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('saveToWayback', () => {
  it('returns the latest-snapshot url on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200 })
    );
    const result = await saveToWayback('https://example.com/page');
    expect(result).toBe('https://web.archive.org/web/2/https://example.com/page');
  });

  it('returns null on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    expect(await saveToWayback('https://example.com/page')).toBeNull();
  });

  it('returns null when the network fails', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(saveToWayback('https://example.com/page')).resolves.toBeNull();
    vi.runAllTimers(); // flush the 40s abort timeout
  });

  it('passes the raw url to the save endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    await saveToWayback('https://example.com/a b?x=1');
    const calledUrl = fetchMock.mock.calls[1][0] as string;
    expect(calledUrl).toBe('https://web.archive.org/save/https://example.com/a b?x=1');
  });

  it('returns the existing snapshot without hitting save', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        archived_snapshots: { closest: { url: 'https://web.archive.org/web/20240101/https://example.com/known' } },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(saveToWayback('https://example.com/known')).resolves.toBe(
      'https://web.archive.org/web/20240101/https://example.com/known'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('looksLikeWaybackSnapshot', () => {
  it('returns false for missing url', () => {
    expect(looksLikeWaybackSnapshot(undefined)).toBe(false);
    expect(looksLikeWaybackSnapshot('')).toBe(false);
  });

  it('accepts availability-api snapshot urls', () => {
    expect(looksLikeWaybackSnapshot('https://web.archive.org/web/20240101120000/https://example.com/')).toBe(true);
  });

  it('accepts latest-snapshot urls', () => {
    expect(looksLikeWaybackSnapshot('https://web.archive.org/web/2/https://example.com/')).toBe(true);
  });

  it('rejects plain fallback urls', () => {
    expect(looksLikeWaybackSnapshot('https://web.archive.org/web/*/https://example.com/')).toBe(false);
  });
});