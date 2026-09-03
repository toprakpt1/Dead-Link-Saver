import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useThemeStore } from '@/store/themeStore';
import { LinkCard } from '@/components/LinkCard';
import { COLORS } from '@/utils/constants';
import type { SavedLink } from '@/store/types';

export default function ForgottenScreen() {
  const { t } = useTranslation();
  const links = useLinkStore((state) => state.links);
  const loadLinks = useLinkStore((state) => state.loadLinks);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const getForgottenLinks = useCallback(
    () => useLinkStore.getState().getForgottenLinks(),
    []
  );
  useThemeStore((s) => s.themeId);
  const c = COLORS;
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
      <Clock size={48} color={c.textMuted} />
      <Text style={[styles.emptyText, { color: c.text }]}>{t('forgotten.emptyTitle')}</Text>
      <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t('forgotten.emptySub')}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>{t('forgotten.title')}</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>{t('forgotten.subtitle')}</Text>
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
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  listContent: { paddingVertical: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
