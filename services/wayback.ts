const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const SAVE_TIMEOUT_MS = 25000;
const LOOKUP_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Closest existing Wayback snapshot for the URL, or null.
 * Cheap availability-API lookup — doubles as the rate-limit escape hatch
 * when /save/ answers 429/401 or demands login.
 */
export async function getWaybackSnapshot(url: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': USER_AGENT } },
      LOOKUP_TIMEOUT_MS
    );
    if (!response.ok || typeof response.json !== 'function') return null;
    const data = await response.json();
    return data?.archived_snapshots?.closest?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Preserves a copy of the URL in the Wayback Machine.
 * Availability first (a snapshot may already exist — skip the rate-limited
 * /save/ call entirely), then /save/ with the raw URL path, then one last
 * availability lookup when /save/ is rate-limited or walled. Best-effort:
 * returns null when nothing can be secured.
 */
export async function saveToWayback(url: string): Promise<string | null> {
  const existing = await getWaybackSnapshot(url);
  if (existing) return existing;

  try {
    // NOTE: /save/ takes the literal URL as its path — pre-encoding the
    // colons/slashes makes the archive store (and redirect to) a wrong key.
    const response = await fetchWithTimeout(`https://web.archive.org/save/${url}`, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/html;q=0.9,*/*;q=0.8',
      },
    }, SAVE_TIMEOUT_MS);
    if (response.ok) {
      // `/web/2/{url}` always resolves to the newest snapshot of the page
      return `https://web.archive.org/web/2/${url}`;
    }
  } catch {
    // fall through to the lookup below
  }
  return getWaybackSnapshot(url);
}

export function looksLikeWaybackSnapshot(archiveUrl?: string): boolean {
  if (!archiveUrl) return false;
  // Availability API snapshots contain "/web/YYYY..." ; plain fallbacks contain "/web/*/"
  return /\/web\/(?!\*\/)/.test(archiveUrl) || archiveUrl.startsWith('https://web.archive.org/web/2/');
}
