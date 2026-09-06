import { afterEach, describe, it, expect, vi } from 'vitest';
import { fetchPageSnapshot } from '@/services/snapshot';

function htmlResponse(html: string, ok = true, status = 200) {
  return { ok, status, text: async () => html };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPageSnapshot', () => {
  it('extracts readable text from html', async () => {
    const html = `<html><head><title>Test Page</title></head><body>
      <h1>Hello World</h1>
      <p>This is a paragraph with an &amp; entity and enough text to pass the minimum length requirement of one hundred and twenty characters or more for sure.</p>
    </body></html>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse(html)));

    const text = await fetchPageSnapshot('https://example.com/article');
    expect(text).toContain('Hello World');
    expect(text).toContain('This is a paragraph with an & entity');
    expect(text).not.toContain('<');
  });

  it('strips scripts, styles and comments', async () => {
    const html = `<html><body>
      <!-- secret comment -->
      <script>var evil = 'should not appear';</script>
      <style>.css{color:red}</style>
      <p>Only this visible paragraph text remains and it is long enough to pass the minimum threshold of one hundred and twenty characters, definitely.</p>
    </body></html>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse(html)));

    const text = await fetchPageSnapshot('https://example.com/article');
    expect(text).toContain('Only this visible paragraph text remains');
    expect(text).not.toContain('evil');
    expect(text).not.toContain('secret comment');
    expect(text).not.toContain('color:red');
  });

  it('keeps paragraph line breaks', async () => {
    const html = `<html><body>
      <p>First line of the article here and it goes on long enough to be counted as real content for the snapshot.</p>
      <p>Second paragraph follows right after the first one in the extraction output.</p>
    </body></html>`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse(html)));

    const text = await fetchPageSnapshot('https://example.com/article');
    const lines = text.split('\n');
    expect(lines).toContain('First line of the article here and it goes on long enough to be counted as real content for the snapshot.');
    expect(lines).toContain('Second paragraph follows right after the first one in the extraction output.');
  });

  it('throws when there is too little content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse('<html><body><p>tiny</p></body></html>')));
    await expect(fetchPageSnapshot('https://example.com/empty')).rejects.toThrow('No readable content found');
  });

  it('throws on non-ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse('<html></html>', false, 403)));
    await expect(fetchPageSnapshot('https://example.com/blocked')).rejects.toThrow();
  });

  it('throws on network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchPageSnapshot('https://example.com/offline')).rejects.toThrow();
  });
});