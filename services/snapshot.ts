import { SNAPSHOT_MAX_CHARS } from '@/utils/constants';

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const FETCH_TIMEOUT_MS = 9000;

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, code: string) => {
      const cp = Number(code);
      try {
        return String.fromCodePoint(cp);
      } catch {
        return '';
      }
    });
}

/**
 * Best-effort HTML → plain text extraction. No DOM is available in React Native,
 * so this is regex based — good enough for reading articles offline.
 */
function htmlToText(html: string): string {
  let text = html;

  // Drop non-content blocks entirely
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/<(script|style|noscript|template|svg|head|iframe|audio|video)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');

  // Turn block/line elements into line breaks so paragraphs survive
  text = text.replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr|blockquote|section|article|figcaption|pre|table)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip everything else tag-like
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common entities
  text = decodeEntities(text);

  // Collapse whitespace per line and drop empty lines
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0);

  return lines.join('\n');
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches a page and extracts its readable text so it can be read offline.
 * Throws when the content can't be captured (offline, blocked, JS-only, empty).
 */
export async function fetchPageSnapshot(url: string): Promise<string> {
  const html = await fetchHtml(url);
  const text = htmlToText(html);

  // Too little content (bot-blocked page, JS-only app, error page, ...)
  if (text.length < 120) {
    throw new Error('No readable content found');
  }

  return text.slice(0, SNAPSHOT_MAX_CHARS);
}
