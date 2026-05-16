import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { LinkCard } from '@/components/LinkCard';
import { COLORS } from '@/utils/constants';
import { SavedLink } from '@/store/types';

export default function ForgottenScreen() {
  const links = useLinkStore((state) => state.links);
  const loadLinks = useLinkStore((state) => state.loadLinks);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const getForgottenLinks = useCallback(
    () => useLinkStore.getState().getForgottenLinks(),
    []
  );
  const [forgottenLinks, setForgottenLinks] = useState<SavedLink[]>([]);

  useEffect(() => {
    loadLinks();
    loadCategories();
  }, [loadLinks, loadCategories]);

  useEffect(() => {
    setForgottenLinks(getForgottenLinks());
  }, [getForgottenLinks, links]);

  const renderItem = ({ item }: { item: SavedLink }) => <LinkCard link={item} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Clock size={48} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>No forgotten links</Text>
      <Text style={styles.emptySubtext}>Links not opened in 30+ days will appear here</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Forgotten Links</Text>
        <Text style={styles.subtitle}>Links you haven't opened in 30+ days</Text>
      </View>

      <FlashList
        data={forgottenLinks}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
