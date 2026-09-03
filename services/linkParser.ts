import { LinkPlatform } from '@/store/types';
import { PLATFORM_PATTERNS } from '@/utils/constants';

export function detectPlatform(url: string): LinkPlatform {
  const normalizedUrl = url.toLowerCase();

  if (PLATFORM_PATTERNS.youtube.test(normalizedUrl)) {
    return 'youtube';
  }
  if (PLATFORM_PATTERNS.reddit.test(normalizedUrl)) {
    return 'reddit';
  }
  if (PLATFORM_PATTERNS.twitter.test(normalizedUrl)) {
    return 'twitter';
  }
  if (PLATFORM_PATTERNS.github.test(normalizedUrl)) {
    return 'github';
  }
  if (PLATFORM_PATTERNS.instagram.test(normalizedUrl)) {
    return 'instagram';
  }
  if (PLATFORM_PATTERNS.medium.test(normalizedUrl)) {
    return 'medium';
  }
  if (PLATFORM_PATTERNS.twitch.test(normalizedUrl)) {
    return 'twitch';
  }
  if (PLATFORM_PATTERNS.discord.test(normalizedUrl)) {
    return 'discord';
  }
  if (PLATFORM_PATTERNS.spotify.test(normalizedUrl)) {
    return 'spotify';
  }
  if (PLATFORM_PATTERNS.linkedin.test(normalizedUrl)) {
    return 'linkedin';
  }

  // Article detection: common blog/news platforms
  if (
    normalizedUrl.includes('blog.') ||
    normalizedUrl.includes('blogger.com') ||
    normalizedUrl.includes('wordpress.com') ||
    normalizedUrl.includes('medium.com') ||
    normalizedUrl.includes('substack.com') ||
    normalizedUrl.includes('hashnode.dev') ||
    normalizedUrl.includes('dev.to') ||
    normalizedUrl.includes('article')
  ) {
    return 'article';
  }

  return 'unknown';
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Query params that are only used for tracking/analytics and add no content.
 * Anything starting with `utm_` is stripped automatically as well.
 */
const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'msclkid',
  'gbraid',
  'wbraid',
  'yclid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'igsh',
  'oly_enc_id',
  'vero_id',
  'wickedid',
  'dclid',
  'reddit_cid',
  'ref',
  'ref_src',
  'ref_campaign',
  'spm',
  'scm',
  'cmpid',
  'campaign_id',
  'feature',
  'ab_channel',
  'si',
  'source',
  'utm_source',
]);

/**
 * URL cleaner: removes common tracking query params (?utm_*, ?fbclid, ...)
 * so the same page saved from different share links ends up identical.
 */
export function cleanUrl(url: string): string {
  let cleaned = url.trim();

  // Remove trailing empty fragment/hash first (e.g. "...#")
  cleaned = cleaned.replace(/#$/, '');

  try {
    const parsed = new URL(cleaned);
    const keep: [string, string][] = [];
    parsed.searchParams.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k.startsWith('utm_') || TRACKING_PARAMS.has(k)) return;
      keep.push([key, value]);
    });
    const qs = new URLSearchParams();
    for (const [key, value] of keep) qs.append(key, value);
    parsed.search = qs.toString();
    return parsed.toString();
  } catch {
    return cleaned;
  }
}

/**
 * Identity key used for duplicate detection. Two URLs with the same key are
 * "the same link" even if the raw strings differ (e.g. a YouTube share link
 * with ?feature=share vs the plain watch URL).
 */
export function canonicalKey(rawUrl: string): string {
  const url = cleanUrl(rawUrl);

  // YouTube: match by video id regardless of list/feature params or short links
  const ytMatch = url.match(/(?:[?&]v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `youtube:${ytMatch[1]}`;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '');
    // Keep sorted query so search pages etc. stay distinct, but ordering doesn't matter
    const query = Array.from(parsed.searchParams.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${host}${path}?${query}`;
  } catch {
    return url;
  }
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

/**
 * Finds all http(s) URLs inside a piece of text (e.g. a pasted message that
 * contains several links, or a link wrapped in prose).
 */
export function extractUrls(text: string): string[] {
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = URL_PATTERN.exec(text)) !== null) {
    let url = match[0];

    // Strip trailing punctuation that isn't part of the URL
    while (url.length > 0 && '.,;:!?)]}>'.includes(url[url.length - 1])) {
      url = url.slice(0, -1);
    }

    // Remove unbalanced closing parens (e.g. "(see https://x.com/a)")
    let closes = (url.match(/\)/g) ?? []).length;
    let opens = 0;
    for (const ch of url) {
      if (ch === '(') opens += 1;
    }
    while (closes > opens && url.endsWith(')')) {
      url = url.slice(0, -1);
      closes -= 1;
    }

    if (isValidUrl(url)) found.push(url);
  }
  return found;
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add https if no protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  return cleanUrl(normalized);
}
