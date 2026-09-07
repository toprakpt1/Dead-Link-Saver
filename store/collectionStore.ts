import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Collection } from './types';
import { STORAGE_KEYS } from '@/utils/constants';

interface CollectionStore {
  collections: Collection[];
  loaded: boolean;
  loadCollections: () => Promise<void>;
  addCollection: (name: string) => Collection | undefined;
  removeCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  addLinkToCollection: (collectionId: string, linkId: string) => void;
  removeLinkFromCollection: (collectionId: string, linkId: string) => void;
  toggleLinkInCollection: (collectionId: string, linkId: string) => void;
  pruneLink: (linkId: string) => void;
  getCollectionsForLink: (linkId: string) => Collection[];
}

function slug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 32) || 'collection';
  return `${base}-${Date.now().toString(36)}`;
}

function persist(collections: Collection[]): void {
  void AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  collections: [],
  loaded: false,

  loadCollections: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      set({ collections: data ? (JSON.parse(data) as Collection[]) : [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addCollection: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return undefined;
    const collection: Collection = {
      id: slug(trimmed),
      name: trimmed,
      linkIds: [],
      createdAt: Date.now(),
    };
    const updated = [...get().collections, collection];
    set({ collections: updated });
    persist(updated);
    return collection;
  },

  removeCollection: (id: string) => {
    const updated = get().collections.filter((c) => c.id !== id);
    set({ collections: updated });
    persist(updated);
  },

  renameCollection: (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = get().collections.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
    set({ collections: updated });
    persist(updated);
  },

  addLinkToCollection: (collectionId: string, linkId: string) => {
    const updated = get().collections.map((c) =>
      c.id === collectionId && !c.linkIds.includes(linkId)
        ? { ...c, linkIds: [...c.linkIds, linkId] }
        : c
    );
    set({ collections: updated });
    persist(updated);
  },

  removeLinkFromCollection: (collectionId: string, linkId: string) => {
    const updated = get().collections.map((c) =>
      c.id === collectionId ? { ...c, linkIds: c.linkIds.filter((l) => l !== linkId) } : c
    );
    set({ collections: updated });
    persist(updated);
  },

  toggleLinkInCollection: (collectionId: string, linkId: string) => {
    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) return;
    if (collection.linkIds.includes(linkId)) {
      get().removeLinkFromCollection(collectionId, linkId);
    } else {
      get().addLinkToCollection(collectionId, linkId);
    }
  },

  // Called when a link is hard-deleted so collections never point at ghosts
  pruneLink: (linkId: string) => {
    const { collections } = get();
    if (!collections.some((c) => c.linkIds.includes(linkId))) return;
    const updated = collections.map((c) => ({
      ...c,
      linkIds: c.linkIds.filter((l) => l !== linkId),
    }));
    set({ collections: updated });
    persist(updated);
  },

  getCollectionsForLink: (linkId: string) => {
    return get().collections.filter((c) => c.linkIds.includes(linkId));
  },
}));
