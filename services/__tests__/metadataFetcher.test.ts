import { afterEach, describe, it, expect, vi } from 'vitest';
import { fetchMetadata, fetchYouTubeMetadata } from '@/services/metadataFetcher';

function microlinkResponse(data?: Record<string, unknown>, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => ({ status: ok ? 'success' : 'error', data }) };
}

function htmlResponse(html: string, ok = true) {
  return { ok, status: ok ? 200 : 500, text: async () => html };
}

const ogHtml = `<html><head>
  <meta property="og:title" content="OG Article Title" />
  <meta property="og:description" content="OG description text" />
  <meta property="og:image" content="https://cdn.example.com/img.png" />
  <meta name="author" content="Jane Doe" />
  <meta name="description" content="Plain description" />
  <title>Page Title Fallback</title>
</head><body>Some article body text that is long enough to matter for real scraping.</body></html>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMetadata', () => {
  it('returns metadata from microlink when successful', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        microlinkResponse({
          title: 'Microlink Title',
          description: 'Microlink desc',
          image: { url: 'https://cdn.example.com/ml.png' },
        })
      )
    );
    await expect(fetchMetadata('https://example.com/post', 'article')).resolves.toEqual({
      title: 'Microlink Title',
      description: 'Microlink desc',
      thumbnail: 'https://cdn.example.com/ml.png',
    });
  });

  it('falls back to parsing og meta tags from direct html', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(microlinkResponse(undefined, false))
      .mockResolvedValueOnce(htmlResponse(ogHtml));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchMetadata('https://example.com/post', 'article')).resolves.toEqual({
      title: 'OG Article Title',
      description: 'OG description text',
      thumbnail: 'https://cdn.example.com/img.png',
      author: 'Jane Doe',
    });
  });

  it('falls back to twitter:title when no og:title exists', async () => {
    const twHtml = ogHtml.replace(
      '<meta property="og:title" content="OG Article Title" />',
      ''
    ).replace('<title>Page Title Fallback</title>', '<meta name="twitter:title" content="Tw Title" />');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(microlinkResponse(undefined, false))
      .mockResolvedValueOnce(htmlResponse(twHtml));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMetadata('https://example.com/post', 'article');
    expect(result.title).toBe('Tw Title');
  });

  it('falls back to the <title> tag when no og/twitter meta is present', async () => {
    const bareHtml = `<html><head><meta name="description" content="only a description" /><title>Plain Title</title></head><body>long enough body text here for a realistic scrape scenario</body></html>`;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(microlinkResponse(undefined, false))
      .mockResolvedValueOnce(htmlResponse(bareHtml));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMetadata('https://example.com/post', 'article');
    expect(result.title).toBe('Plain Title');
  });

  it('extracts a title from the url when everything fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(microlinkResponse(undefined, false))
      .mockResolvedValueOnce(htmlResponse('<html></html>', false));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchMetadata('https://example.com/2024/a-nice-guide', 'article')).resolves.toEqual({
      title: 'a nice guide',
    });
  });

  it('truncates very long titles', async () => {
    const longTitle = 'x'.repeat(500);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(microlinkResponse({ title: longTitle })));
    const result = await fetchMetadata('https://example.com/post', 'article');
    expect(result.title?.length).toBe(200);
  });
});

describe('fetchYouTubeMetadata', () => {
  it('returns oembed data when available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          title: 'Cool Video',
          author_name: 'Some Creator',
          thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        }),
      })
    );
    await expect(
      fetchYouTubeMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).resolves.toEqual({
      title: 'Cool Video',
      description: 'By Some Creator',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      author: 'Some Creator',
    });
  });

  it('falls back to generic fetch when oembed fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce(microlinkResponse({ title: 'Generic Title' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchYouTubeMetadata('https://youtu.be/dQw4w9WgXcQ')).resolves.toEqual({
      title: 'Generic Title',
    });
  });

  it('goes straight to generic fetch when no video id is found', async () => {
    const fetchMock = vi.fn().mockResolvedValue(microlinkResponse({ title: 'Generic Title' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchYouTubeMetadata('https://www.youtube.com/results?search_query=x')).resolves.toEqual({
      title: 'Generic Title',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});