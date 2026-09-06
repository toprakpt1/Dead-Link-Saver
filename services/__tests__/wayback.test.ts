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

  it('encodes the url in the save request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    await saveToWayback('https://example.com/a b?x=1');
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://web.archive.org/save/https%3A%2F%2Fexample.com%2Fa%20b%3Fx%3D1');
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