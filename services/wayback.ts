const USER_AGENT = 'Mozilla/5.0 (compatible; DeadLinkSaver/1.0)';

/**
 * Requests the Wayback Machine to save a snapshot of the given URL.
 * Returns a stable "latest snapshot" URL on success, or null on failure.
 * Runs with a long timeout because archiving a page can take a while.
 */
export async function saveToWayback(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);
  try {
    const response = await fetch(`https://web.archive.org/save/${encodeURIComponent(url)}`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/html;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) return null;
    // `/web/2/{url}` always resolves to the newest snapshot of the page
    return `https://web.archive.org/web/2/${url}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function looksLikeWaybackSnapshot(archiveUrl?: string): boolean {
  if (!archiveUrl) return false;
  // Availability API snapshots contain "/web/YYYY..." ; plain fallbacks contain "/web/*/"
  return /\/web\/(?!\*\/)/.test(archiveUrl) || archiveUrl.startsWith('https://web.archive.org/web/2/');
}
