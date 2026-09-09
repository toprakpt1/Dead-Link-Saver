import type { SavedLink, LinkCheckStatus } from '@/store/types';

// Browser-like UA: bot walls (Medium, X, YouTube, Cloudflare-fronted blogs)
// treat a bare bot token as hostile and answer HEAD with 403/503 for pages
// that are perfectly alive. Same UA as the snapshot fetcher on purpose.
const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const HEAD_TIMEOUT_MS = 10000;
const GET_TIMEOUT_MS = 12000;

export interface LinkCheckResult {
  isDead: boolean;
  archiveUrl?: string;
  statusCode?: number;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

const HEAD_INIT: RequestInit = {
  method: 'HEAD',
  headers: { 'User-Agent': USER_AGENT },
};

// Range keeps the fallback cheap: headers decide, the body is dropped.
const GET_INIT: RequestInit = {
  method: 'GET',
  redirect: 'follow',
  headers: {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    Range: 'bytes=0-2047',
  },
};

// Only these mean "the page is gone". Everything else — 401/403/429
// (login / bot / rate walls), 3xx, 2xx — means alive: a wall is not a grave.
function isDeadStatus(status: number): boolean {
  return status === 404 || status === 410 || status >= 500;
}

// HEAD outcomes that say nothing about liveness: the method was rejected
// (405/501) or a wall answered (400/401/403/408/429). GET is the tiebreak.
function needsGetFallback(status: number): boolean {
  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 405 ||
    status === 408 ||
    status === 429 ||
    status === 501
  );
}

// Resolves the single status code a check is judged by. Never throws for a
// definitive answer; throws only when no response was ever received (so the
// caller records 'error', never 'dead').
async function probeStatus(url: string): Promise<number> {
  let headStatus: number;
  try {
    headStatus = (await fetchWithTimeout(url, HEAD_INIT, HEAD_TIMEOUT_MS)).status;
  } catch {
    // Edge dropped HEAD (offline, DNS, CORS) but GET may still go through —
    // several hosts block HEAD at the edge while serving GET fine.
    return (await fetchWithTimeout(url, GET_INIT, GET_TIMEOUT_MS)).status;
  }

  if (needsGetFallback(headStatus)) {
    return (await fetchWithTimeout(url, GET_INIT, GET_TIMEOUT_MS)).status;
  }

  if (isDeadStatus(headStatus)) {
    // HEAD claims dead: confirm with GET before condemning. Bot walls
    // sometimes answer HEAD with 503 for alive pages.
    try {
      return (await fetchWithTimeout(url, GET_INIT, GET_TIMEOUT_MS)).status;
    } catch {
      // GET stayed silent after HEAD already spoke — keep HEAD's answer.
      return headStatus;
    }
  }

  return headStatus;
}

export async function checkLinkStatus(url: string): Promise<LinkCheckResult> {
  try {
    const status = await probeStatus(url);

    // A wall on GET (403/429/...) overrules a dead-claiming HEAD: a challenge
    // page is not a missing page. isDeadStatus is only true for 404/410/5xx.
    if (isDeadStatus(status)) {
      const archiveUrl = await getArchiveUrl(url);
      return { isDead: true, archiveUrl, statusCode: status };
    }

    return { isDead: false, statusCode: status };
  } catch (error) {
    console.error('Link check failed:', error);
    // No response at all: surface without statusCode so the caller records
    // 'error', never alive-or-dead on zero evidence.
    return { isDead: false };
  }
}

async function getArchiveUrl(url: string): Promise<string | undefined> {
  try {
    const archiveCheckUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
    const response = await fetch(archiveCheckUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.archived_snapshots?.closest?.url) {
        return data.archived_snapshots.closest.url;
      }
    }
  } catch (error) {
    console.error('Archive check failed:', error);
  }
  
  return `https://web.archive.org/web/*/${url}`;
}

export async function checkMultipleLinks(
  urls: string[],
  onProgress?: (checked: number, total: number) => void
): Promise<Map<string, { isDead: boolean; archiveUrl?: string; statusCode?: number }>> {
  const results = new Map<string, { isDead: boolean; archiveUrl?: string; statusCode?: number }>();
  
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const checks = await Promise.all(
      batch.map(async (url) => {
        const result = await checkLinkStatus(url);
        return { url, ...result };
      })
    );
    checks.forEach(({ url, isDead, archiveUrl, statusCode }) => results.set(url, { isDead, archiveUrl, statusCode }));
    onProgress?.(Math.min(i + batchSize, urls.length), urls.length);
  }
  
  return results;
}

export const MAX_LINK_CHECKS = 50;

// Appends one health-check entry, keeping only the most recent ones so
// long-lived links don't grow storage unbounded.
export function appendCheck(
  link: SavedLink,
  status: LinkCheckStatus,
  statusCode?: number,
  at: number = Date.now()
): SavedLink {
  const entry = statusCode === undefined
    ? { checkedAt: at, status }
    : { checkedAt: at, status, statusCode };
  return { ...link, checks: [...(link.checks ?? []), entry].slice(-MAX_LINK_CHECKS) };
}
