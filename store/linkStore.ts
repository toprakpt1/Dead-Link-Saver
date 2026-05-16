import { create } from 'zustand';
import { LinkStore, SavedLink } from './types';
import { storage } from '@/utils/storage';
import { detectPlatform, isValidUrl, normalizeUrl } from '@/services/linkParser';
import { fetchMetadata, fetchYouTubeMetadata } from '@/services/metadataFetcher';
import { classifyLink } from '@/services/categoryClassifier';
import { checkMultipleLinks } from '@/services/linkChecker';
import { FORGOTTEN_DAYS_THRESHOLD } from '@/utils/constants';

export const TUTORIAL_SAMPLE_URL = 'https://reactnative.dev/docs/getting-started';

export const useLinkStore = create<LinkStore>((set, get) => ({
  links: [],
  isLoading: false,

  loadLinks: async () => {
    set({ isLoading: true });
    try {
      const links = await storage.loadLinks();
      set({ links, isLoading: false });
    } catch (error) {
      console.error('Failed to load links:', error);
      set({ isLoading: false });
    }
  },

  addLink: async (url: string) => {
    const normalizedUrl = normalizeUrl(url);

    if (!isValidUrl(normalizedUrl)) {
      throw new Error('Invalid URL');
    }

    // Check for duplicates
    const existingLink = get().links.find((link) => link.url === normalizedUrl);
    if (existingLink) {
      throw new Error('Link already exists');
    }

    set({ isLoading: true });

    try {
      const platform = detectPlatform(normalizedUrl);
      
      // Fetch metadata based on platform
      const metadata =
        platform === 'youtube'
          ? await fetchYouTubeMetadata(normalizedUrl)
          : await fetchMetadata(normalizedUrl, platform);

      const category = classifyLink(normalizedUrl, platform, metadata);

      const newLink: SavedLink = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        url: normalizedUrl,
        platform,
        category,
        status: 'unread',
        metadata,
        isDead: false,
        isFavorite: false,
        createdAt: Date.now(),
        openCount: 0,
      };

      const updatedLinks = [newLink, ...get().links];
      set({ links: updatedLinks, isLoading: false });
      await storage.saveLinks(updatedLinks);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addSampleLink: async () => {
    const existingLink = get().links.find((link) => link.url === TUTORIAL_SAMPLE_URL);

    if (existingLink) {
      return existingLink;
    }

    const sampleLink: SavedLink = {
      id: `tutorial-${Date.now()}`,
      url: TUTORIAL_SAMPLE_URL,
      platform: 'article',
      category: 'education',
      status: 'unread',
      metadata: {
        title: 'React Native Getting Started',
        description: 'A sample link for learning how saved links and categories work.',
        author: 'React Native',
      },
      isDead: false,
      isFavorite: false,
      createdAt: Date.now(),
      openCount: 0,
    };

    const updatedLinks = [sampleLink, ...get().links];
    set({ links: updatedLinks });
    await storage.saveLinks(updatedLinks);
    return sampleLink;
  },

  removeLink: (id: string) => {
    const updatedLinks = get().links.filter((link) => link.id !== id);
    set({ links: updatedLinks });
    storage.saveLinks(updatedLinks);
  },

  toggleFavorite: (id: string) => {
    const updatedLinks = get().links.map((link) =>
      link.id === id ? { ...link, isFavorite: !link.isFavorite } : link
    );
    set({ links: updatedLinks });
    storage.saveLinks(updatedLinks);
  },

  updateStatus: (id: string, status) => {
    const updatedLinks = get().links.map((link) =>
      link.id === id ? { ...link, status } : link
    );
    set({ links: updatedLinks });
    storage.saveLinks(updatedLinks);
  },

  updateLinkCategory: (id: string, category) => {
    const updatedLinks = get().links.map((link) =>
      link.id === id ? { ...link, category } : link
    );
    set({ links: updatedLinks });
    storage.saveLinks(updatedLinks);
  },

  markAsOpened: (id: string) => {
    const updatedLinks = get().links.map((link) =>
      link.id === id
        ? {
            ...link,
            lastOpenedAt: Date.now(),
            openCount: link.openCount + 1,
            status: link.status === 'unread' ? 'watched' : link.status,
          }
        : link
    );
    set({ links: updatedLinks });
    storage.saveLinks(updatedLinks);
  },

  checkDeadLinks: async () => {
    const links = get().links;
    const urls = links.map((link) => link.url);
    
    const results = await checkMultipleLinks(urls);
    const deadIds: string[] = [];
    
    const updatedLinks = links.map((link) => {
      const result = results.get(link.url);
      if (result?.isDead && !link.isDead) {
        deadIds.push(link.id);
        return { ...link, isDead: true, archiveUrl: result.archiveUrl };
      }
      return link;
    });
    
    set({ links: updatedLinks });
    await storage.saveLinks(updatedLinks);
    return deadIds;
  },

  getForgottenLinks: () => {
    const now = Date.now();
    const threshold = FORGOTTEN_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;

    return get().links.filter((link) => {
      if (link.openCount === 0) {
        return now - link.createdAt > threshold;
      }
      if (link.lastOpenedAt) {
        return now - link.lastOpenedAt > threshold;
      }
      return false;
    });
  },
}));
