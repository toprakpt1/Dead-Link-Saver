import { LinkMetadata, LinkPlatform } from '@/store/types';
import { DEFAULT_CATEGORIES } from '@/store/types';

export function classifyLink(
  url: string,
  platform: LinkPlatform,
  metadata: LinkMetadata
): string {
  const searchText = `${url} ${metadata.title} ${metadata.description || ''}`.toLowerCase();

  // Platform-based classification
  if (platform === 'github') {
    return 'code';
  }

  // Keyword-based classification using defaults (categories loaded at runtime in UI)
  for (const cat of DEFAULT_CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return cat.id;
      }
    }
  }

  return 'random';
}
