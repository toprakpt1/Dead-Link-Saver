export async function checkLinkStatus(url: string): Promise<{ isDead: boolean; archiveUrl?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeadLinkSaver/1.0)',
      },
    });

    clearTimeout(timeoutId);

    const isDead = response.status === 404 || response.status >= 500;

    if (isDead) {
      const archiveUrl = await getArchiveUrl(url);
      return { isDead: true, archiveUrl };
    }

    return { isDead: false };
  } catch (error) {
    console.error('Link check failed:', error);
    // If check fails, assume link is alive (network issues, CORS, etc.)
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

export async function checkMultipleLinks(urls: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // Check links in batches to avoid overwhelming the network
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const checks = await Promise.all(
      batch.map(async (url) => {
        const result = await checkLinkStatus(url);
        return { url, isDead: result.isDead };
      })
    );
    
    checks.forEach(({ url, isDead }) => results.set(url, isDead));
  }
  
  return results;
}
