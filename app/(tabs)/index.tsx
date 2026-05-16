import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ShieldAlert, Bookmark } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { LinkInput } from '@/components/LinkInput';
import { LinkCard } from '@/components/LinkCard';
import { COLORS } from '@/utils/constants';
import { SavedLink } from '@/store/types';

export default function HomeScreen() {
  const { links, loadLinks, checkDeadLinks } = useLinkStore();
  const { categories, loadCategories, loaded } = useCategoryStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadLinks();
    loadCategories();
  }, []);

  const filteredLinks = selectedCategory
    ? links.filter((l) => l.category === selectedCategory)
    : links;

  const handleCheckDeadLinks = async () => {
    await checkDeadLinks();
  };

  const renderItem = ({ item }: { item: SavedLink }) => <LinkCard link={item} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bookmark size={48} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>No saved links yet</Text>
      <Text style={styles.emptySubtext}>Paste a link above to get started</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinkInput />

      {links.length > 0 && loaded && (
        <View>
          <View style={styles.toolbar}>
            <Text style={styles.count}>{filteredLinks.length} links</Text>
            <TouchableOpacity style={styles.checkButton} onPress={handleCheckDeadLinks}>
              <ShieldAlert size={16} color={COLORS.primary} />
              <Text style={styles.checkButtonText}>Check Dead Links</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === null && styles.filterChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.filterChipText, selectedCategory === null && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const count = links.filter((l) => l.category === cat.id).length;
              if (count === 0) return null;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]}
                  onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === cat.id && { color: cat.color }]}>
                    {cat.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlashList
        data={filteredLinks}
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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  count: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  filterBar: {
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.primary,
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
  },
});
