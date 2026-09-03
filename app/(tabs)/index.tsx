import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ShieldAlert, Bookmark, Star, Trash2, Tags, CheckSquare, Bell, X, ArrowRight } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useEntitlementStore } from '@/store/entitlementStore';
import { useThemeStore } from '@/store/themeStore';
import { LinkInput } from '@/components/LinkInput';
import { SearchBar } from '@/components/SearchBar';
import { LinkCard } from '@/components/LinkCard';
import { CategoryPicker } from '@/components/CategoryPicker';
import { RewardedGate } from '@/components/RewardedGate';
import { PaywallSheet } from '@/components/PaywallSheet';
import { COLORS, REMINDER_DAYS_THRESHOLD } from '@/utils/constants';
import { hapticDelete } from '@/utils/haptics';
import type { SavedLink } from '@/store/types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { links, loadLinks, checkDeadLinks, removeLink, checkProgress, batchDelete, batchUpdateCategory, batchCheckDeadLinks } = useLinkStore();
  const { categories, loadCategories, loaded } = useCategoryStore();
  const isDark = useThemeStore((s) => s.theme.isDark); // re-render on theme change
  const c = COLORS;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [batchPickerVisible, setBatchPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gateVisible, setGateVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [showRemindersOnly, setShowRemindersOnly] = useState(false);

  const isChecking = checkProgress !== null;
  const selectionActive = selectionMode || selectedIds.size > 0;
  const reminderMs = REMINDER_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
  const isReminder = (l: SavedLink) =>
    l.status === 'unread' && l.openCount === 0 && Date.now() - l.createdAt >= reminderMs;
  const reminderLinks = links.filter(isReminder);

  useEffect(() => {
    loadLinks();
    loadCategories();
  }, []);

  const filteredLinks = links
    .filter((l) => (showFavoritesOnly ? l.isFavorite : true))
    .filter((l) => (showRemindersOnly ? isReminder(l) : true))
    .filter((l) => (selectedCategory ? l.category === selectedCategory : true))
    .filter((l) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.metadata.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.metadata.description?.toLowerCase().includes(q)) ||
        (l.metadata.author?.toLowerCase().includes(q))
      );
    });

  const runDeadCheck = async () => {
    if (isChecking) return;
    try {
      const deadIds = await checkDeadLinks();
      if (!useEntitlementStore.getState().isPro) {
        await useEntitlementStore.getState().consumeCheck();
      }
      if (deadIds.length === 0) {
        Alert.alert(t('common.success'), t('home.noDeadFound'));
      } else {
        Alert.alert(
          t('home.deadFoundTitle'),
          t('home.deadFoundBody', { count: deadIds.length }),
          [
            { text: t('common.keep'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: () => deadIds.forEach((id) => removeLink(id)),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Dead link check failed:', error);
    }
  };

  const handleCheckDeadLinks = async () => {
    if (isChecking) return;
    const ent = useEntitlementStore.getState();
    if (!ent.canCheckDeadLinks()) {
      setPendingAction(() => runDeadCheck);
      setGateVisible(true);
      return;
    }
    await runDeadCheck();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBatchDelete = () => {
    const ids = Array.from(selectedIds);
    Alert.alert(
      t('home.deleteLinksTitle'),
      t('home.deleteLinksBody', { count: ids.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            hapticDelete();
            batchDelete(ids);
            clearSelection();
          },
        },
      ]
    );
  };

  const handleBatchCategory = (category: string) => {
    batchUpdateCategory(Array.from(selectedIds), category);
    clearSelection();
  };

  const runBatchCheck = async () => {
    const ids = Array.from(selectedIds);
    try {
      const deadIds = await batchCheckDeadLinks(ids);
      if (!useEntitlementStore.getState().isPro) {
        await useEntitlementStore.getState().consumeCheck();
      }
      clearSelection();
      if (deadIds.length === 0) {
        Alert.alert(t('common.success'), t('home.noDeadFoundSelection'));
      } else {
        Alert.alert(
          t('home.deadFoundTitle'),
          t('home.deadFoundBodySelection', { count: deadIds.length }),
          [
            { text: t('common.keep'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: () => {
                deadIds.forEach((id) => removeLink(id));
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Batch dead link check failed:', error);
    }
  };

  const handleBatchCheck = async () => {
    if (isChecking) return;
    const ent = useEntitlementStore.getState();
    if (!ent.canCheckDeadLinks()) {
      setPendingAction(() => runBatchCheck);
      setGateVisible(true);
      return;
    }
    await runBatchCheck();
  };

  const renderItem = ({ item }: { item: SavedLink }) => (
    <LinkCard link={item} selectionMode={selectionActive} isSelected={selectedIds.has(item.id)} onToggleSelect={toggleSelect} />
  );

  const renderEmpty = () => {
    if (showRemindersOnly) {
      return (
        <View style={styles.emptyContainer}>
          <Bell size={48} color={c.textMuted} />
          <Text style={[styles.emptyText, { color: c.text }]}>{t('reminder.emptyTitle')}</Text>
          <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t('reminder.emptySub', { days: REMINDER_DAYS_THRESHOLD })}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Bookmark size={48} color={c.textMuted} />
        <Text style={[styles.emptyText, { color: c.text }]}>{showFavoritesOnly ? t('home.emptyTitleFav') : t('home.emptyTitle')}</Text>
        <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{showFavoritesOnly ? t('home.emptySubFav') : t('home.emptySub')}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinkInput />

      {links.length > 0 && loaded && <SearchBar value={searchQuery} onChangeText={setSearchQuery} />}

      {links.length > 0 && loaded && (
        <View>
          <View style={[styles.toolbar, { borderBottomColor: c.border }]}>
            {selectionActive ? (
              <>
                <TouchableOpacity onPress={clearSelection} style={styles.cancelButton}>
                  <Text style={[styles.cancelButtonText, { color: c.textMuted }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <Text style={[styles.count, { color: c.textMuted }]}>{t('home.selectedCount', { count: selectedIds.size })}</Text>
                <View style={styles.bulkActions}>
                  <TouchableOpacity onPress={handleBatchDelete} style={styles.bulkButton}>
                    <Trash2 size={16} color={c.error} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setBatchPickerVisible(true)} style={styles.bulkButton}>
                    <Tags size={16} color={c.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleBatchCheck} disabled={isChecking} style={styles.bulkButton}>
                    {isChecking ? <ActivityIndicator size={16} color={c.primary} /> : <ShieldAlert size={16} color={c.primary} />}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.count, { color: c.textMuted }]}>{t('home.linksCount', { count: filteredLinks.length })}</Text>
                <View style={styles.bulkActions}>
                  <TouchableOpacity style={styles.checkButton} onPress={handleCheckDeadLinks} disabled={isChecking}>
                    {isChecking ? <ActivityIndicator size={16} color={c.primary} /> : <ShieldAlert size={16} color={c.primary} />}
                    <Text style={[styles.checkButtonText, { color: c.primary }]}>
                      {isChecking ? t('home.checking', { checked: checkProgress!.checked, total: checkProgress!.total }) : t('home.checkDeadLinks')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectionMode(true);
                    }}
                    style={[styles.selectButton, { borderColor: c.border }]}
                  >
                    <CheckSquare size={16} color={c.textMuted} />
                    <Text style={[styles.selectButtonText, { color: c.textMuted }]}>{t('home.select')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterBar, { borderBottomColor: c.border }]}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, { borderColor: c.border }, selectedCategory === null && !showFavoritesOnly && !showRemindersOnly && { borderColor: c.primary, backgroundColor: c.primaryMuted }]}
              onPress={() => {
                setSelectedCategory(null);
                setShowFavoritesOnly(false);
                setShowRemindersOnly(false);
              }}
            >
              <Text style={[styles.filterChipText, { color: c.textMuted }, selectedCategory === null && !showFavoritesOnly && { color: c.primary }]}>{t('common.all')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, { borderColor: c.border }, showFavoritesOnly && { borderColor: c.warning, backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)' }]}
              onPress={() => {
                setShowFavoritesOnly((prev) => !prev);
                setShowRemindersOnly(false);
              }}
            >
              <View style={styles.filterChipRow}>
                <Star size={14} color={showFavoritesOnly ? c.warning : c.textMuted} fill={showFavoritesOnly ? c.warning : 'none'} />
                <Text style={[styles.filterChipText, { color: c.textMuted }, showFavoritesOnly && { color: c.warning }]}>
                  {t('home.favorites')} ({links.filter((l) => l.isFavorite).length})
                </Text>
              </View>
            </TouchableOpacity>
            {categories.map((cat) => {
              const count = links.filter((l) => l.category === cat.id).length;
              if (count === 0) return null;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, { borderColor: c.border }, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + (isDark ? '33' : '20') }]}
                  onPress={() => {
                    setShowRemindersOnly(false);
                    setSelectedCategory(cat.id === selectedCategory ? null : cat.id);
                  }}
                >
                  <Text style={[styles.filterChipText, { color: c.textMuted }, selectedCategory === cat.id && { color: cat.color }]}>
                    {cat.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {reminderLinks.length > 0 &&
        (showRemindersOnly ? (
          <View style={[styles.reminderActiveBar, { backgroundColor: c.primaryMuted, borderBottomColor: c.border }]}>
            <Bell size={14} color={c.primary} />
            <Text style={[styles.reminderActiveText, { color: c.primary }]}>
              {t('reminder.filterTitle', { count: reminderLinks.length })}
            </Text>
            <TouchableOpacity onPress={() => setShowRemindersOnly(false)} hitSlop={8} style={styles.reminderClear}>
              <X size={16} color={c.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.reminderBanner, { backgroundColor: isDark ? 'rgba(108,142,255,0.08)' : 'rgba(15,118,110,0.06)', borderColor: c.primary }]}
            onPress={() => {
              setSelectedCategory(null);
              setShowFavoritesOnly(false);
              setShowRemindersOnly(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.reminderIcon, { backgroundColor: c.primaryMuted }]}>
              <Bell size={15} color={c.primary} />
            </View>
            <View style={styles.reminderTextWrap}>
              <Text style={[styles.reminderBannerText, { color: c.text }]} numberOfLines={2}>
                {t('reminder.banner', { count: reminderLinks.length, days: REMINDER_DAYS_THRESHOLD })}
              </Text>
            </View>
            <View style={styles.reminderCta}>
              <Text style={[styles.reminderCtaText, { color: c.primary }]}>{t('reminder.view')}</Text>
              <ArrowRight size={14} color={c.primary} />
            </View>
          </TouchableOpacity>
        ))}

      <FlashList data={filteredLinks} renderItem={renderItem} ListEmptyComponent={renderEmpty} contentContainerStyle={styles.listContent} />
      <CategoryPicker visible={batchPickerVisible} current="" onSelect={handleBatchCategory} onClose={() => setBatchPickerVisible(false)} />

      <RewardedGate
        visible={gateVisible}
        type="check"
        onClose={() => {
          setGateVisible(false);
          setPendingAction(null);
        }}
        onRewarded={() => {
          setGateVisible(false);
          const action = pendingAction;
          setPendingAction(null);
          if (action) void action();
        }}
        onGoPro={() => {
          setGateVisible(false);
          setPaywallVisible(true);
        }}
      />
      <PaywallSheet visible={paywallVisible} onClose={() => setPaywallVisible(false)} feature="check" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  count: { fontSize: 14 },
  checkButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkButtonText: { fontSize: 14, fontWeight: '500' },
  cancelButton: { paddingVertical: 4, paddingHorizontal: 4 },
  cancelButtonText: { fontSize: 14 },
  bulkActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulkButton: { padding: 4 },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectButtonText: { fontSize: 13, fontWeight: '500' },
  filterBar: { minHeight: 52, borderBottomWidth: 1 },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 6, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  filterChipText: { fontSize: 13, fontWeight: '500' },
  filterChipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listContent: { paddingVertical: 8 },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reminderIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderTextWrap: { flex: 1 },
  reminderBannerText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  reminderCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reminderCtaText: { fontSize: 13, fontWeight: '700' },
  reminderActiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  reminderActiveText: { flex: 1, fontSize: 13, fontWeight: '600' },
  reminderClear: { padding: 2 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14 },
});
