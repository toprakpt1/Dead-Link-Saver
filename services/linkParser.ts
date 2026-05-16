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

export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  
  // Add https if no protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}
