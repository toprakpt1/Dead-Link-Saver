import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedLink } from '@/store/types';

vi.mock('@/services/metadataFetcher', () => ({
  fetchMetadata: vi.fn(async () => ({ title: 'Mocked Title' })),
  fetchYouTubeMetadata: vi.fn(async () => ({ title: 'Mocked YouTube Title' })),
}));

vi.mock('@/services/snapshot', () => ({
  fetchPageSnapshot: vi.fn(async () => 'Mocked snapshot content'),
}));

vi.mock('@/services/linkChecker', () => ({
  checkMultipleLinks: vi.fn(async () => new Map()),
}));

vi.mock('@/services/wayback', () => ({
  saveToWayback: vi.fn(async () => null),
  looksLikeWaybackSnapshot: vi.fn(() => false),
}));

const storageMock = vi.hoisted(() => ({
  saveLinks: vi.fn(async (_links: SavedLink[]) => {}),
  loadLinks: vi.fn(async (): Promise<SavedLink[]> => []),
}));

vi.mock('@/utils/storage', () => ({ storage: storageMock }));

import { useLinkStore } from '@/store/linkStore';
import { fetchMetadata, fetchYouTubeMetadata } from '@/services/metadataFetcher';
import { fetchPageSnapshot } from '@/services/snapshot';
import { checkMultipleLinks } from '@/services/linkChecker';
import { saveToWayback } from '@/services/wayback';

function linkAt(url: string, overrides: Partial<SavedLink> = {}): SavedLink {
  return {
    id: `id-${url}`,
    url,
    platform: 'unknown',
    category: 'random',
    status: 'unread',
    metadata: { title: url },
    isDead: false,
    isFavorite: false,
    createdAt: Date.now(),
    openCount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  storageMock.saveLinks.mockImplementation(async () => {});
  storageMock.loadLinks.mockImplementation(async () => []);
  useLinkStore.setState({
    links: [],
    isLoading: false,
    deletedLink: null,
    checkProgress: null,
  });
});

describe('addLink', () => {
  it('normalizes, classifies and stores a valid link', async () => {
    await useLinkStore.getState().addLink('github.com/facebook/react');

    const state = useLinkStore.getState();
    expect(state.links).toHaveLength(1);
    expect(state.links[0].url).toBe('https://github.com/facebook/react');
    expect(state.links[0].platform).toBe('github');
    expect(state.links[0].category).toBe('code');
    expect(state.links[0].status).toBe('unread');
    expect(state.links[0].isFavorite).toBe(false);
    expect(fetchMetadata).toHaveBeenCalled();
    expect(storageMock.saveLinks).toHaveBeenCalledWith(state.links);
  });

  it('uses the youtube metadata fetcher for youtube urls', async () => {
    await useLinkStore.getState().addLink('https://youtu.be/dQw4w9WgXcQ');
    expect(fetchYouTubeMetadata).toHaveBeenCalled();
    expect(fetchMetadata).not.toHaveBeenCalled();
    expect(useLinkStore.getState().links[0].platform).toBe('youtube');
  });

  it('rejects invalid urls', async () => {
    await expect(useLinkStore.getState().addLink('not a url')).rejects.toThrow('Invalid URL');
    expect(storageMock.saveLinks).not.toHaveBeenCalled();
    expect(useLinkStore.getState().links).toHaveLength(0);
  });

  it('rejects an exact duplicate', async () => {
    await useLinkStore.getState().addLink('https://example.com/page');
    await expect(useLinkStore.getState().addLink('https://example.com/page')).rejects.toThrow(
      'Link already exists'
    );
    expect(useLinkStore.getState().links).toHaveLength(1);
  });

  it('rejects canonical duplicates such as youtube short links', async () => {
    await useLinkStore.getState().addLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await expect(
      useLinkStore.getState().addLink('https://youtu.be/dQw4w9WgXcQ?feature=share')
    ).rejects.toThrow('A similar link is already saved');
  });

  it('captures an offline snapshot for text platforms in the background', async () => {
    await useLinkStore.getState().addLink('https://example.com/readable-article');
    await vi.waitFor(() => {
      const link = useLinkStore.getState().links[0];
      expect(link.snapshot?.text).toBe('Mocked snapshot content');
    });
    expect(fetchPageSnapshot).toHaveBeenCalledWith('https://example.com/readable-article');
  });
});

describe('addSampleLink', () => {
  it('adds the sample link on first call and returns the existing one later', async () => {
    const first = await useLinkStore.getState().addSampleLink();
    expect(first.id).toMatch(/^tutorial-/);
    expect(useLinkStore.getState().links).toHaveLength(1);

    const second = await useLinkStore.getState().addSampleLink();
    expect(second.id).toBe(first.id);
    expect(useLinkStore.getState().links).toHaveLength(1);
  });
});

describe('delete & undo', () => {
  it('removeLink deletes the link', () => {
    useLinkStore.setState({ links: [linkAt('https://a.com')] });
    useLinkStore.getState().removeLink('id-https://a.com');
    expect(useLinkStore.getState().links).toHaveLength(0);
    expect(storageMock.saveLinks).toHaveBeenCalledWith([]);
  });

  it('softDelete removes the link but undo restores it', () => {
    const link = linkAt('https://a.com');
    useLinkStore.setState({ links: [link] });

    useLinkStore.getState().softDelete(link.id);
    expect(useLinkStore.getState().links).toHaveLength(0);
    expect(useLinkStore.getState().deletedLink).toEqual(link);

    useLinkStore.getState().undoDelete();
    expect(useLinkStore.getState().links).toEqual([link]);
    expect(useLinkStore.getState().deletedLink).toBeNull();
  });

  it('clears deletedLink after the undo window expires', () => {
    vi.useFakeTimers();
    const link = linkAt('https://a.com');
    useLinkStore.setState({ links: [link] });

    useLinkStore.getState().softDelete(link.id);
    expect(useLinkStore.getState().deletedLink).toEqual(link);

    vi.advanceTimersByTime(5001);
    expect(useLinkStore.getState().deletedLink).toBeNull();
    vi.useRealTimers();
  });
});

describe('updates', () => {
  it('toggleFavorite flips and restores the flag', () => {
    useLinkStore.setState({ links: [linkAt('https://a.com')] });
    useLinkStore.getState().toggleFavorite('id-https://a.com');
    expect(useLinkStore.getState().links[0].isFavorite).toBe(true);
    useLinkStore.getState().toggleFavorite('id-https://a.com');
    expect(useLinkStore.getState().links[0].isFavorite).toBe(false);
  });

  it('updateStatus changes the status', () => {
    useLinkStore.setState({ links: [linkAt('https://a.com')] });
    useLinkStore.getState().updateStatus('id-https://a.com', 'watched');
    expect(useLinkStore.getState().links[0].status).toBe('watched');
  });

  it('updateLinkCategory changes the category', () => {
    useLinkStore.setState({ links: [linkAt('https://a.com')] });
    useLinkStore.getState().updateLinkCategory('id-https://a.com', 'education');
    expect(useLinkStore.getState().links[0].category).toBe('education');
  });

  it('markAsOpened tracks open counts and flips unread to watched', () => {
    useLinkStore.setState({ links: [linkAt('https://a.com')] });
    useLinkStore.getState().markAsOpened('id-https://a.com');
    const link = useLinkStore.getState().links[0];
    expect(link.openCount).toBe(1);
    expect(link.status).toBe('watched');
    expect(link.lastOpenedAt).toBeTypeOf('number');

    useLinkStore.getState().markAsOpened('id-https://a.com');
    expect(useLinkStore.getState().links[0].openCount).toBe(2);
    expect(useLinkStore.getState().links[0].status).toBe('watched');
  });

  it('batchDelete removes all targeted links', () => {
    useLinkStore.setState({
      links: [linkAt('https://a.com'), linkAt('https://b.com'), linkAt('https://c.com')],
    });
    useLinkStore.getState().batchDelete(['id-https://a.com', 'id-https://c.com']);
    expect(useLinkStore.getState().links.map((l) => l.url)).toEqual(['https://b.com']);
  });

  it('batchUpdateCategory only touches targeted links', () => {
    useLinkStore.setState({
      links: [linkAt('https://a.com'), linkAt('https://b.com')],
    });
    useLinkStore.getState().batchUpdateCategory(['id-https://a.com'], 'news');
    const [a, b] = useLinkStore.getState().links;
    expect(a.category).toBe('news');
    expect(b.category).toBe('random');
  });
});

describe('dead-link checks', () => {
  it('batchCheckDeadLinks marks dead links and reports progress', async () => {
    const live = linkAt('https://alive.example.com');
    const dead = linkAt('https://gone.example.com');
    useLinkStore.setState({ links: [live, dead] });

    const mocked = checkMultipleLinks as ReturnType<typeof vi.fn>;
    mocked.mockImplementation(async (urls: string[], onProgress?: (c: number, t: number) => void) => {
      onProgress?.(urls.length, urls.length);
      return new Map([
        ['https://alive.example.com', { isDead: false }],
        ['https://gone.example.com', { isDead: true, archiveUrl: 'https://archive/1' }],
      ]);
    });

    const progress: Array<[number, number]> = [];
    const deadIds = await useLinkStore
      .getState()
      .batchCheckDeadLinks(['id-https://alive.example.com', 'id-https://gone.example.com'], (c, t) =>
        progress.push([c, t])
      );

    expect(deadIds).toEqual(['id-https://gone.example.com']);
    const [updatedLive, updatedDead] = useLinkStore.getState().links;
    expect(updatedLive.isDead).toBe(false);
    expect(updatedDead.isDead).toBe(true);
    expect(updatedDead.archiveUrl).toBe('https://archive/1');
    expect(useLinkStore.getState().checkProgress).toBeNull();
    expect(progress).toEqual([[2, 2]]);
  });

  it('auto-archives newly dead links through the wayback machine', async () => {
    const dead = linkAt('https://gone.example.com');
    useLinkStore.setState({ links: [dead] });

    const mocked = checkMultipleLinks as ReturnType<typeof vi.fn>;
    mocked.mockResolvedValue(
      new Map([['https://gone.example.com', { isDead: true, archiveUrl: 'https://fallback' }]])
    );
    (saveToWayback as ReturnType<typeof vi.fn>).mockResolvedValue('https://web.archive.org/web/2/https://gone.example.com');

    await useLinkStore.getState().checkDeadLinks();

    await vi.waitFor(() => {
      expect(useLinkStore.getState().links[0].archiveUrl).toBe(
        'https://web.archive.org/web/2/https://gone.example.com'
      );
    });
    expect(saveToWayback).toHaveBeenCalledWith('https://gone.example.com');
  });

  it('keeps links alive when the check fails', async () => {
    const link = linkAt('https://maybe.example.com');
    useLinkStore.setState({ links: [link] });
    (checkMultipleLinks as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Map([['https://maybe.example.com', { isDead: false }]])
    );
    const deadIds = await useLinkStore.getState().checkDeadLinks();
    expect(deadIds).toEqual([]);
    expect(useLinkStore.getState().links[0].isDead).toBe(false);
  });
});

describe('getForgottenLinks', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  it('returns unread links older than the threshold', () => {
    useLinkStore.setState({
      links: [
        linkAt('https://old.example.com', { createdAt: now - 31 * DAY, openCount: 0 }),
        linkAt('https://new.example.com', { createdAt: now - 1 * DAY, openCount: 0 }),
      ],
    });
    const forgotten = useLinkStore.getState().getForgottenLinks();
    expect(forgotten.map((l) => l.url)).toEqual(['https://old.example.com']);
  });

  it('returns links not opened for a long time', () => {
    useLinkStore.setState({
      links: [
        linkAt('https://opened-old.example.com', {
          createdAt: now - 200 * DAY,
          openCount: 3,
          lastOpenedAt: now - 31 * DAY,
        }),
        linkAt('https://opened-recent.example.com', {
          createdAt: now - 200 * DAY,
          openCount: 3,
          lastOpenedAt: now - 1 * DAY,
        }),
      ],
    });
    const forgotten = useLinkStore.getState().getForgottenLinks();
    expect(forgotten.map((l) => l.url)).toEqual(['https://opened-old.example.com']);
  });
});

describe('loadLinks', () => {
  it('loads stored links', async () => {
    storageMock.loadLinks.mockResolvedValueOnce([linkAt('https://stored.example.com')]);
    await useLinkStore.getState().loadLinks();
    expect(useLinkStore.getState().links).toHaveLength(1);
    expect(useLinkStore.getState().isLoading).toBe(false);
  });
});