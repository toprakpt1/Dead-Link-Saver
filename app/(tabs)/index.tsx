import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ShieldAlert, Bookmark, Star } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { LinkInput } from '@/components/LinkInput';
import { LinkCard } from '@/components/LinkCard';
import { COLORS } from '@/utils/constants';
import { SavedLink } from '@/store/types';

export default function HomeScreen() {
  const { links, loadLinks, checkDeadLinks, removeLink } = useLinkStore();
  const { categories, loadCategories, loaded } = useCategoryStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    loadLinks();
    loadCategories();
  }, []);

  const filteredLinks = links
    .filter((l) => showFavoritesOnly ? l.isFavorite : true)
    .filter((l) => selectedCategory ? l.category === selectedCategory : true);

  const handleCheckDeadLinks = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const deadIds = await checkDeadLinks();
      if (deadIds.length === 0) {
        Alert.alert('Result', 'No dead links found.');
      } else {
        Alert.alert(
          'Dead Links Found',
          `${deadIds.length} dead link${deadIds.length > 1 ? 's' : ''} found. Delete them?`,
          [
            { text: 'Keep', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deadIds.forEach((id) => removeLink(id)),
            },
          ]
        );
      }
    } finally {
      setIsChecking(false);
    }
  };

  const renderItem = ({ item }: { item: SavedLink }) => <LinkCard link={item} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bookmark size={48} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>
        {showFavoritesOnly ? 'No favorite links yet' : 'No saved links yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {showFavoritesOnly ? 'Star a link to add it here' : 'Paste a link above to get started'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinkInput />

      {links.length > 0 && loaded && (
        <View>
          <View style={styles.toolbar}>
            <Text style={styles.count}>{filteredLinks.length} links</Text>
            <TouchableOpacity style={styles.checkButton} onPress={handleCheckDeadLinks} disabled={isChecking}>
              {isChecking ? (
                <ActivityIndicator size={16} color={COLORS.primary} />
              ) : (
                <ShieldAlert size={16} color={COLORS.primary} />
              )}
              <Text style={styles.checkButtonText}>{isChecking ? 'Checking...' : 'Check Dead Links'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === null && !showFavoritesOnly && styles.filterChipActive]}
              onPress={() => { setSelectedCategory(null); setShowFavoritesOnly(false); }}
            >
              <Text style={[styles.filterChipText, selectedCategory === null && !showFavoritesOnly && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, showFavoritesOnly && styles.filterChipFav]}
              onPress={() => setShowFavoritesOnly((prev) => !prev)}
            >
              <View style={styles.filterChipRow}>
                <Star size={14} color={showFavoritesOnly ? COLORS.warning : COLORS.textMuted}
                      fill={showFavoritesOnly ? COLORS.warning : 'none'} />
                <Text style={[styles.filterChipText, showFavoritesOnly && styles.filterChipTextFav]}>
                  Favoriler ({links.filter((l) => l.isFavorite).length})
                </Text>
              </View>
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
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    borderColor: COLORS.border,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  filterChipFav: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '20',
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  filterChipTextFav: {
    color: COLORS.warning,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
