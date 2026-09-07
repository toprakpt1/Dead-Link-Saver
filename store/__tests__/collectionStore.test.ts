import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/utils/constants';

const asyncStorageMock = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn(async (key: string) => { store.delete(key); }),
    clear: vi.fn(async () => { store.clear(); }),
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));

import { useCollectionStore } from '@/store/collectionStore';

beforeEach(async () => {
  vi.clearAllMocks();
  await asyncStorageMock.clear();
  useCollectionStore.setState({ collections: [], loaded: false });
});

describe('addCollection / removeCollection', () => {
  it('creates a collection with a unique id', () => {
    const created = useCollectionStore.getState().addCollection('Tez için');
    expect(created?.name).toBe('Tez için');
    expect(created?.id).toMatch(/^tez-iin-/);
    expect(useCollectionStore.getState().collections).toHaveLength(1);
  });

  it('ignores blank names', () => {
    expect(useCollectionStore.getState().addCollection('   ')).toBeUndefined();
    expect(useCollectionStore.getState().collections).toHaveLength(0);
  });

  it('removes a collection but keeps the links', () => {
    const created = useCollectionStore.getState().addCollection('Watchlist')!;
    useCollectionStore.getState().addLinkToCollection(created.id, 'link-1');
    useCollectionStore.getState().removeCollection(created.id);
    expect(useCollectionStore.getState().collections).toHaveLength(0);
  });

  it('persists to storage', async () => {
    useCollectionStore.getState().addCollection('Thesis');
    const raw = await asyncStorageMock.getItem(STORAGE_KEYS.COLLECTIONS);
    expect(JSON.parse(raw ?? '[]')).toHaveLength(1);
  });
});

describe('membership', () => {
  it('adds without duplicates and toggles both ways', () => {
    const created = useCollectionStore.getState().addCollection('Refs')!;
    const s = () => useCollectionStore.getState();
    s().addLinkToCollection(created.id, 'l1');
    s().addLinkToCollection(created.id, 'l1');
    expect(s().collections[0].linkIds).toEqual(['l1']);
    s().toggleLinkInCollection(created.id, 'l1');
    expect(s().collections[0].linkIds).toEqual([]);
    s().toggleLinkInCollection(created.id, 'l1');
    expect(s().collections[0].linkIds).toEqual(['l1']);
  });

  it('prunes deleted links from every collection', () => {
    const s = () => useCollectionStore.getState();
    const a = s().addCollection('A')!;
    const b = s().addCollection('B')!;
    s().addLinkToCollection(a.id, 'gone');
    s().addLinkToCollection(b.id, 'gone');
    s().addLinkToCollection(b.id, 'kept');
    s().pruneLink('gone');
    expect(s().collections.find((c) => c.id === a.id)?.linkIds).toEqual([]);
    expect(s().collections.find((c) => c.id === b.id)?.linkIds).toEqual(['kept']);
  });

  it('finds collections containing a link', () => {
    const s = () => useCollectionStore.getState();
    const a = s().addCollection('A')!;
    s().addCollection('B');
    s().addLinkToCollection(a.id, 'l1');
    expect(s().getCollectionsForLink('l1').map((c) => c.id)).toEqual([a.id]);
    expect(s().getCollectionsForLink('missing')).toEqual([]);
  });
});

describe('loadCollections', () => {
  it('loads stored collections', async () => {
    await asyncStorageMock.setItem(
      STORAGE_KEYS.COLLECTIONS,
      JSON.stringify([{ id: 'c1', name: 'Stored', linkIds: ['l1'], createdAt: 1 }])
    );
    await useCollectionStore.getState().loadCollections();
    const { collections, loaded } = useCollectionStore.getState();
    expect(loaded).toBe(true);
    expect(collections).toHaveLength(1);
  });
});
