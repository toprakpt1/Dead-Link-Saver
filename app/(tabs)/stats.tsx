import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ChartColumn, Bookmark, Unlink, Star, Eye, ShieldAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useThemeStore } from '@/store/themeStore';
import { COLORS } from '@/utils/constants';
import { PLATFORM_ICONS, PLATFORM_LABELS, PLATFORM_COLORS } from '@/utils/platforms';
import type { LinkPlatform } from '@/store/types';

const ALL_PLATFORMS: LinkPlatform[] = [
  'youtube', 'reddit', 'twitter', 'github', 'instagram', 'medium',
  'article', 'unknown', 'twitch', 'discord', 'spotify', 'linkedin',
];

export default function StatsScreen() {
  const { t } = useTranslation();
  const links = useLinkStore((s) => s.links);
  const loadLinks = useLinkStore((s) => s.loadLinks);
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  useThemeStore((s) => s.themeId);
  const c = COLORS;

  useEffect(() => {
    loadLinks();
    loadCategories();
  }, [loadLinks, loadCategories]);

  const total = links.length;
  const opened = links.filter((l) => l.openCount > 0 || l.status !== 'unread').length;
  const unread = links.filter((l) => l.status === 'unread').length;
  const dead = links.filter((l) => l.isDead).length;
  const favorites = links.filter((l) => l.isFavorite).length;

  const readRate = total > 0 ? Math.round((opened / total) * 100) : 0;
  const deadRate = total > 0 ? Math.round((dead / total) * 100) : 0;

  const platformRows = ALL_PLATFORMS.map((platform) => ({
    platform,
    count: links.filter((l) => l.platform === platform).length,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const categoryRows = links.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] ?? 0) + 1;
    return acc;
  }, {});

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ChartColumn size={48} color={c.textMuted} />
      <Text style={[styles.emptyText, { color: c.text }]}>{t('stats.emptyTitle')}</Text>
      <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t('stats.emptySub')}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>{t('tabs.statsTitle')}</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>{t('stats.subtitle')}</Text>
      </View>

      {total === 0 ? (
        renderEmpty()
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.tiles}>
            <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Bookmark size={18} color={c.primary} />
              <Text style={[styles.tileValue, { color: c.text }]}>{total}</Text>
              <Text style={[styles.tileLabel, { color: c.textMuted }]}>{t('stats.total')}</Text>
            </View>
            <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Eye size={18} color={c.success} />
              <Text style={[styles.tileValue, { color: c.text }]}>{unread}</Text>
              <Text style={[styles.tileLabel, { color: c.textMuted }]}>{t('stats.unread')}</Text>
            </View>
            <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Star size={18} color={c.warning} />
              <Text style={[styles.tileValue, { color: c.text }]}>{favorites}</Text>
              <Text style={[styles.tileLabel, { color: c.textMuted }]}>{t('stats.favorites')}</Text>
            </View>
            <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Unlink size={18} color={c.error} />
              <Text style={[styles.tileValue, { color: c.text }]}>{dead}</Text>
              <Text style={[styles.tileLabel, { color: c.textMuted }]}>{t('stats.dead')}</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t('stats.ratesTitle')}</Text>
            <View style={styles.rateRow}>
              <View style={styles.rateLabelWrap}>
                <ShieldAlert size={16} color={c.textMuted} />
                <Text style={[styles.rateLabel, { color: c.text }]}>{t('stats.readRate')}</Text>
              </View>
              <Text style={[styles.rateValue, { color: c.text }]}>{readRate}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: c.border }]}>
              <View style={[styles.fill, { backgroundColor: c.success, width: `${readRate}%` }]} />
            </View>
            <View style={styles.rateRow}>
              <View style={styles.rateLabelWrap}>
                <Unlink size={16} color={c.textMuted} />
                <Text style={[styles.rateLabel, { color: c.text }]}>{t('stats.deadRate')}</Text>
              </View>
              <Text style={[styles.rateValue, { color: c.text }]}>{deadRate}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: c.border }]}>
              <View style={[styles.fill, { backgroundColor: c.error, width: `${deadRate}%` }]} />
            </View>
          </View>

          {platformRows.length > 0 && (
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('stats.byPlatformTitle')}</Text>
              {platformRows.map(({ platform, count }) => {
                const Icon = PLATFORM_ICONS[platform];
                const pct = Math.round((count / total) * 100);
                return (
                  <View key={platform} style={styles.distRow}>
                    <Icon size={16} color={PLATFORM_COLORS[platform]} />
                    <Text style={[styles.distName, { color: c.text }]}>{PLATFORM_LABELS[platform]}</Text>
                    <View style={[styles.distTrack, { backgroundColor: c.border }]}>
                      <View
                        style={[
                          styles.distFill,
                          { backgroundColor: PLATFORM_COLORS[platform], width: `${Math.max(pct, 4)}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.distCount, { color: c.textMuted }]}>{count}</Text>
                    <Text style={[styles.distPct, { color: c.textMuted }]}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          )}

          {Object.keys(categoryRows).length > 0 && (
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{t('stats.byCategoryTitle')}</Text>
              {Object.entries(categoryRows)
                .sort((a, b) => b[1] - a[1])
                .map(([catId, count]) => {
                  const cat = categories.find((x) => x.id === catId);
                  const color = cat?.color ?? c.textMuted;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <View key={catId} style={styles.distRow}>
                      <View style={[styles.catDot, { backgroundColor: color }]} />
                      <Text style={[styles.distName, { color: c.text }]} numberOfLines={1}>
                        {cat?.name ?? catId}
                      </Text>
                      <View style={[styles.distTrack, { backgroundColor: c.border }]}>
                        <View
                          style={[styles.distFill, { backgroundColor: color, width: `${Math.max(pct, 4)}%` }]}
                        />
                      </View>
                      <Text style={[styles.distCount, { color: c.textMuted }]}>{count}</Text>
                      <Text style={[styles.distPct, { color: c.textMuted }]}>{pct}%</Text>
                    </View>
                  );
                })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  content: { padding: 16, gap: 12 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  tileValue: { fontSize: 26, fontWeight: '800' },
  tileLabel: { fontSize: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  rateLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateLabel: { fontSize: 13, fontWeight: '500' },
  rateValue: { fontSize: 13, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 3 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  distName: { width: 60, fontSize: 13, fontWeight: '500' },
  distTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 3 },
  distCount: { fontSize: 13, fontWeight: '700', minWidth: 22, textAlign: 'right' },
  distPct: { fontSize: 12, minWidth: 34, textAlign: 'right' },
  catDot: { width: 12, height: 12, borderRadius: 6 },
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
