import { create } from 'zustand';
import { LinkStore, SavedLink, LinkPlatform } from './types';
import { storage } from '@/utils/storage';
import { detectPlatform, isValidUrl, normalizeUrl, canonicalKey } from '@/services/linkParser';
import { fetchMetadata, fetchYouTubeMetadata } from '@/services/metadataFetcher';
import { classifyLink } from '@/services/categoryClassifier';
import { checkMultipleLinks } from '@/services/linkChecker';
import { fetchPageSnapshot } from '@/services/snapshot';
import { saveToWayback, looksLikeWaybackSnapshot } from '@/services/wayback';
import { scheduleSnoozeNotification, cancelScheduledNotification } from '@/services/notifications';
import i18n from '@/utils/i18n';
import { appendCheck } from '@/services/linkChecker';
import { useCollectionStore } from '@/store/collectionStore';
import { FORGOTTEN_DAYS_THRESHOLD } from '@/utils/constants';

export const TUTORIAL_SAMPLE_URL = 'https://reactnative.dev/docs/getting-started';

let deleteTimer: ReturnType<typeof setTimeout> | null = null;

// Platforms whose pages are worth capturing as offline-readable text
const SNAPSHOT_PLATFORMS: LinkPlatform[] = ['article', 'medium', 'unknown'];
const snapshotInFlight = new Set<string>();
const archivingInFlight = new Set<string>();

// Runs after a scan marks links dead: asks the Wayback Machine to preserve a
// copy so the content isn't lost. Best-effort, never blocks or fails a scan.
async function autoArchiveDeadLinks(deadIds: string[]): Promise<void> {
  for (const id of deadIds) {
    const current = useLinkStore.getState();
    const link = current.links.find((l) => l.id === id);
    if (!link || archivingInFlight.has(id)) continue;
    // Skip if a real Wayback snapshot already exists for this link
    if (looksLikeWaybackSnapshot(link.archiveUrl)) continue;

    archivingInFlight.add(id);
    try {
      const snapshotUrl = await saveToWayback(link.url);
      if (snapshotUrl) {
        const updatedLinks = useLinkStore.getState().links.map((l) =>
          l.id === id ? { ...l, archiveUrl: snapshotUrl } : l
        );
        useLinkStore.setState({ links: updatedLinks });
        await storage.saveLinks(updatedLinks);
      }
    } catch {
      // Archiving is best-effort
    } finally {
      archivingInFlight.delete(id);
    }
  }
}

// Maps a checker outcome to a stored health entry. Missing results (check
// threw before a response) are recorded as 'error', never as alive.
function recordCheckResult(
  link: SavedLink,
  isDead: boolean | undefined,
  statusCode: number | undefined
): SavedLink {
  const status = statusCode === undefined ? 'error' : isDead ? 'dead' : 'alive';
  return appendCheck(link, status, statusCode);
}

export const useLinkStore = create<LinkStore>((set, get) => ({
  links: [],
  isLoading: false,
  deletedLink: null,
  deletedLinks: [],
  checkProgress: null,

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

  captureSnapshot: async (id: string) => {
    const link = get().links.find((l) => l.id === id);
    if (!link || link.snapshot || snapshotInFlight.has(id)) return false;
    snapshotInFlight.add(id);
    try {
      const text = await fetchPageSnapshot(link.url);
      const updatedLinks = get().links.map((l) =>
        l.id === id ? { ...l, snapshot: { text, capturedAt: Date.now() } } : l
      );
      set({ links: updatedLinks });
      await storage.saveLinks(updatedLinks);
      return true;
    } catch {
      return false;
    } finally {
      snapshotInFlight.delete(id);
    }
  },

  addLink: async (url: string) => {
    const normalizedUrl = normalizeUrl(url);

    if (!isValidUrl(normalizedUrl)) {
      throw new Error('Invalid URL');
    }

    // Check for duplicates (exact match or same canonical link, e.g. YouTube share variants)
    const duplicate = get().links.find(
      (link) => canonicalKey(link.url) === canonicalKey(normalizedUrl)
    );
    if (duplicate) {
      if (duplicate.url === normalizedUrl) {
        throw new Error('Link already exists');
      }
      throw new Error('A similar link is already saved');
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

      // Best-effort offline copy for text pages — runs in background, never blocks saving
      if (SNAPSHOT_PLATFORMS.includes(platform)) {
        void get().captureSnapshot(newLink.id);
      }
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
    get().softDelete(id);
  },

  softDelete: (id: string) => {
    const link = get().links.find((l) => l.id === id);
    if (!link) return;

    if (deleteTimer) {
      clearTimeout(deleteTimer);
      deleteTimer = null;
    }

    const updatedLinks = get().links.filter((l) => l.id !== id);
    set({ links: updatedLinks, deletedLink: link, deletedLinks: [] });
    storage.saveLinks(updatedLinks);

    deleteTimer = setTimeout(() => {
      useCollectionStore.getState().pruneLink(id);
      set({ deletedLink: null });
      deleteTimer = null;
    }, 5000);
  },

  softDeleteMany: (ids: string[]) => {
    if (ids.length === 0) return;
    const removed = get().links.filter((l) => ids.includes(l.id));
    if (removed.length === 0) return;

    if (deleteTimer) {
      clearTimeout(deleteTimer);
      deleteTimer = null;
    }

    const updatedLinks = get().links.filter((l) => !ids.includes(l.id));
    set({ links: updatedLinks, deletedLink: null, deletedLinks: removed });
    storage.saveLinks(updatedLinks);

    deleteTimer = setTimeout(() => {
      const prune = useCollectionStore.getState().pruneLink;
      removed.forEach((l) => prune(l.id));
      set({ deletedLinks: [] });
      deleteTimer = null;
    }, 5000);
  },

  undoDelete: () => {
    const deletedLink = get().deletedLink;
    const deletedLinks = get().deletedLinks;
    if (!deletedLink && deletedLinks.length === 0) return;

    if (deleteTimer) {
      clearTimeout(deleteTimer);
      deleteTimer = null;
    }

    const restored = [...(deletedLink ? [deletedLink] : []), ...deletedLinks];
    const updatedLinks = [...restored, ...get().links];
    set({ links: updatedLinks, deletedLink: null, deletedLinks: [] });
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

  batchDelete: (ids: string[]) => {
    get().softDeleteMany(ids);
  },

  batchUpdateCategory: (ids: string[], category) => {
    const updatedLinks = get().links.map((link) =>
      ids.includes(link.id) ? { ...link, category } : link
    );
    set({ links: updatedLinks });
    storage.saveLinks(updatedLinks);
  },

  batchCheckDeadLinks: async (ids: string[], onProgress) => {
    const allLinks = get().links;
    const targetLinks = allLinks.filter((l) => ids.includes(l.id));
    const urls = targetLinks.map((l) => l.url);

    set({ checkProgress: { checked: 0, total: urls.length } });

    const results = await checkMultipleLinks(urls, (checked, total) => {
      set({ checkProgress: { checked, total } });
      onProgress?.(checked, total);
    });

    const deadIds: string[] = [];

    const updatedLinks = allLinks.map((link) => {
      if (!ids.includes(link.id)) return link;
      const result = results.get(link.url);
      const withCheck = recordCheckResult(link, result?.isDead, result?.statusCode);
      if (result?.isDead && !link.isDead) {
        deadIds.push(link.id);
        return { ...withCheck, isDead: true, archiveUrl: result.archiveUrl };
      }
      return withCheck;
    });

    set({ links: updatedLinks, checkProgress: null });
    await storage.saveLinks(updatedLinks);
    void autoArchiveDeadLinks(deadIds);
    return deadIds;
  },

  markAsOpened: (id: string) => {
    const current = get().links.find((link) => link.id === id);
    // Opening dismisses any pending snooze — the reminder served its purpose
    if (current?.reminderId) {
      void cancelScheduledNotification(current.reminderId);
    }
    const updatedLinks = get().links.map((link) =>
      link.id === id
        ? {
            ...link,
            lastOpenedAt: Date.now(),
            openCount: link.openCount + 1,
            status: link.status === 'unread' ? 'watched' : link.status,
            remindAt: undefined,
            reminderId: undefined,
          }
        : link
    );
    set({ links: updatedLinks });
    storage.saveLinks(updatedLinks);
  },

  checkDeadLinks: async () => {
    const links = get().links;
    const urls = links.map((link) => link.url);

    set({ checkProgress: { checked: 0, total: urls.length } });

    const results = await checkMultipleLinks(urls, (checked, total) => {
      set({ checkProgress: { checked, total } });
    });

    const deadIds: string[] = [];

    const updatedLinks = links.map((link) => {
      const result = results.get(link.url);
      const withCheck = recordCheckResult(link, result?.isDead, result?.statusCode);
      if (result?.isDead && !link.isDead) {
        deadIds.push(link.id);
        return { ...withCheck, isDead: true, archiveUrl: result.archiveUrl };
      }
      return withCheck;
    });

    set({ links: updatedLinks, checkProgress: null });
    await storage.saveLinks(updatedLinks);
    void autoArchiveDeadLinks(deadIds);
    return deadIds;
  },

  snoozeLink: async (id: string, atMs: number) => {
    const link = get().links.find((l) => l.id === id);
    if (!link) return;
    if (link.reminderId) {
      await cancelScheduledNotification(link.reminderId);
    }
    const reminderId = await scheduleSnoozeNotification(
      id,
      link.metadata.title || link.url,
      i18n.t('snooze.body'),
      atMs
    );
    const updatedLinks = get().links.map((l) =>
      l.id === id ? { ...l, remindAt: atMs, reminderId: reminderId ?? undefined } : l
    );
    set({ links: updatedLinks });
    await storage.saveLinks(updatedLinks);
  },

  clearReminder: async (id: string) => {
    const link = get().links.find((l) => l.id === id);
    if (link?.reminderId) {
      await cancelScheduledNotification(link.reminderId);
    }
    const updatedLinks = get().links.map((l) =>
      l.id === id ? { ...l, remindAt: undefined, reminderId: undefined } : l
    );
    set({ links: updatedLinks });
    await storage.saveLinks(updatedLinks);
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
