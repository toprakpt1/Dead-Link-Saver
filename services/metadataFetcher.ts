import { LinkMetadata, LinkPlatform } from '@/store/types';

function getMetaContent(html: string, selector: string): string | undefined {
  // `<meta ... property="og:title" ... content="value" ...>` with the two
  // attributes in either order, using single or double quotes.
  const regex = new RegExp(
    `<meta[^>]+(?:${selector}["'])[^>]*content=["']([^"']*)["']|` +
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:${selector}["'])`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1] || match?.[2];
}

function getTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || '';
}

async function fetchDirectHTML(url: string): Promise<{ html: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    return { html };
  } catch {
    return null;
  }
}

function parseOGFromHTML(html: string): Partial<LinkMetadata> {
  return {
    title:
      getMetaContent(html, 'property=["\']og:title') ||
      getMetaContent(html, 'name=["\']twitter:title') ||
      getTitle(html) ||
      undefined,
    description:
      getMetaContent(html, 'property=["\']og:description') ||
      getMetaContent(html, 'name=["\']twitter:description') ||
      getMetaContent(html, 'name=["\']description') ||
      undefined,
    thumbnail:
      getMetaContent(html, 'property=["\']og:image') ||
      getMetaContent(html, 'name=["\']twitter:image') ||
      undefined,
    author:
      getMetaContent(html, 'name=["\']author') ||
      getMetaContent(html, 'property=["\']article:author') ||
      undefined,
  };
}

interface MicrolinkResponse {
  status: string;
  data?: {
    title?: string;
    description?: string;
    image?: { url: string };
    logo?: { url: string };
  };
}

async function fetchViaMicrolink(url: string): Promise<Partial<LinkMetadata> | null> {
  try {
    const response = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&timeout=5000`
    );
    if (!response.ok) return null;
    const json: MicrolinkResponse = await response.json();
    if (json.status !== 'success' || !json.data) return null;
    return {
      title: json.data.title,
      description: json.data.description,
      thumbnail: json.data.image?.url,
    };
  } catch {
    return null;
  }
}

export async function fetchMetadata(url: string, platform: LinkPlatform): Promise<LinkMetadata> {
  // Try OpenGraph proxy first
  const proxyResult = await fetchViaMicrolink(url);
  if (proxyResult?.title) {
    return {
      title: proxyResult.title.trim().substring(0, 200),
      description: proxyResult.description?.trim().substring(0, 300),
      thumbnail: proxyResult.thumbnail,
    };
  }

  // Fallback: try direct HTML fetch
  const directResult = await fetchDirectHTML(url);
  if (directResult) {
    const og = parseOGFromHTML(directResult.html);
    if (og.title) {
      return {
        title: og.title.trim().substring(0, 200),
        description: og.description?.trim().substring(0, 300),
        thumbnail: og.thumbnail,
        author: og.author,
      };
    }
  }

  // Last resort: extract from URL
  return {
    title: extractTitleFromUrl(url),
  };
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const segments = path.split('/').filter(Boolean);

    // Try to find meaningful segments
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (
        segment.length > 3 &&
        !/^[0-9a-f]{8,}$/i.test(segment) &&
        !/^\d+$/.test(segment)
      ) {
        return segment.replace(/[-_]/g, ' ').substring(0, 100);
      }
    }

    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown Link';
  }
}

export async function fetchYouTubeMetadata(url: string): Promise<LinkMetadata> {
  const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]+)/);
  const videoId = videoIdMatch?.[1];

  if (!videoId) {
    return fetchMetadata(url, 'youtube');
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || 'YouTube Video',
        description: `By ${data.author_name || 'Unknown'}`,
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        author: data.author_name,
      };
    }
  } catch {
    // fall through to generic fetch
  }

  return fetchMetadata(url, 'youtube');
}
