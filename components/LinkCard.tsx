import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Star, Trash2, Unlink, Eye, BookmarkPlus, CheckCircle2, Square, CheckSquare, BookOpenText } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SavedLink, LinkStatus, CardSize } from '@/store/types';
import { COLORS } from '@/utils/constants';
import { CategoryBadge } from './CategoryBadge';
import { CategoryPicker } from './CategoryPicker';
import { useLinkStore } from '@/store/linkStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { useThemeStore } from '@/store/themeStore';
import { hapticDelete, hapticFavorite } from '@/utils/haptics';
import { PLATFORM_ICONS, PLATFORM_LABELS } from '@/utils/platforms';

const STATUS_ICONS: Record<LinkStatus, typeof Eye> = {
  unread: Eye,
  watched: CheckCircle2,
  saved: BookmarkPlus,
};

const SIZE_MAP: Record<CardSize, {
  cardPadding: number; cardMarginV: number; headerGap: number; headerMb: number;
  titleSize: number; titleMb: number; descSize: number; descMb: number;
  iconSize: number; platformSize: number; actionGap: number; actionPad: number;
  deadHPad: number; deadVPad: number; deadGap: number; deadSize: number;
  statusSize: number; placeholderIcon: number; thumbMb: number; thumbHeight: number;
}> = {
  small: {
    cardPadding: 8, cardMarginV: 3, headerGap: 4, headerMb: 4,
    titleSize: 14, titleMb: 2, descSize: 12, descMb: 4,
    iconSize: 16, platformSize: 11, actionGap: 6, actionPad: 1,
    deadHPad: 5, deadVPad: 2, deadGap: 2, deadSize: 10,
    statusSize: 12, placeholderIcon: 24, thumbMb: 4, thumbHeight: 80,
  },
  medium: {
    cardPadding: 10, cardMarginV: 4, headerGap: 6, headerMb: 6,
    titleSize: 15, titleMb: 3, descSize: 13, descMb: 6,
    iconSize: 18, platformSize: 11, actionGap: 8, actionPad: 2,
    deadHPad: 6, deadVPad: 3, deadGap: 3, deadSize: 11,
    statusSize: 14, placeholderIcon: 32, thumbMb: 6, thumbHeight: 120,
  },
  large: {
    cardPadding: 14, cardMarginV: 6, headerGap: 8, headerMb: 8,
    titleSize: 17, titleMb: 4, descSize: 15, descMb: 8,
    iconSize: 22, platformSize: 13, actionGap: 12, actionPad: 4,
    deadHPad: 8, deadVPad: 4, deadGap: 4, deadSize: 12,
    statusSize: 16, placeholderIcon: 40, thumbMb: 8, thumbHeight: 160,
  },
};

interface LinkCardProps {
  link: SavedLink;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function LinkCard({ link, selectionMode = false, isSelected = false, onToggleSelect }: LinkCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { softDelete, toggleFavorite, markAsOpened, updateStatus, updateLinkCategory } = useLinkStore();
  const cardSize = useSettingsStore((s) => s.cardSize);
  const tutorialStage = useTutorialStore((s) => s.stage);
  const tutorialSampleLinkId = useTutorialStore((s) => s.sampleLinkId);
  const setTutorialStage = useTutorialStore((s) => s.setStage);
  const isDark = useThemeStore((s) => s.theme.isDark);
  const c = COLORS;
  const s = SIZE_MAP[cardSize];
  const [pickerVisible, setPickerVisible] = useState(false);
  const isTutorialTarget = tutorialSampleLinkId === link.id;
  const tutorialCategoryTarget = link.category === 'entertainment' ? 'education' : 'entertainment';
  const badgePressedRef = useRef(false);

  const PlatformIcon = PLATFORM_ICONS[link.platform];
  const StatusIcon = STATUS_ICONS[link.status];
  // Platforms whose pages can be captured as readable text → offer the offline reader
  const isReadablePlatform = ['article', 'medium', 'unknown'].includes(link.platform);

  const closePicker = () => {
    setPickerVisible(false);
    if (isTutorialTarget && useTutorialStore.getState().stage === 'pick-category') {
      setTutorialStage('tap-category');
    }
  };

  const handlePress = async () => {
    if (badgePressedRef.current) {
      badgePressedRef.current = false;
      return;
    }
    if (selectionMode) {
      onToggleSelect?.(link.id);
      return;
    }
    if (link.isDead && link.archiveUrl) {
      Alert.alert(
        t('linkCard.deleteTitle'),
        t('linkCard.deleteBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('linkCard.openArchive'),
            onPress: () => {
              Linking.openURL(link.archiveUrl!);
              markAsOpened(link.id);
            },
          },
        ]
      );
      return;
    }
    await Linking.openURL(link.url);
    markAsOpened(link.id);
  };

  const handleDelete = () => {
    hapticDelete();
    softDelete(link.id);
  };

  const cycleStatus = () => {
    const order: LinkStatus[] = ['unread', 'watched', 'saved'];
    const idx = order.indexOf(link.status);
    const next = order[(idx + 1) % order.length];
    updateStatus(link.id, next);
  };

  return (
    <TouchableOpacity
      style={[
        { padding: s.cardPadding, marginVertical: s.cardMarginV, backgroundColor: c.surface, borderRadius: 8, marginHorizontal: 12, borderWidth: 1, borderColor: c.border },
        isSelected && { borderColor: c.primary, backgroundColor: c.primaryMuted },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.header, { gap: s.headerGap, marginBottom: s.headerMb }]}>
        {selectionMode && (
          <Pressable onPress={(e) => { e.stopPropagation(); onToggleSelect?.(link.id); }} hitSlop={8}>
            {isSelected ? (
              <CheckSquare size={s.statusSize} color={c.primary} />
            ) : (
              <Square size={s.statusSize} color={c.textMuted} />
            )}
          </Pressable>
        )}
        <Pressable onPress={(e) => { e.stopPropagation(); cycleStatus(); }} hitSlop={8}>
          <StatusIcon size={s.statusSize} color={link.status === 'unread' ? c.primary : link.status === 'watched' ? c.success : c.secondary} />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (isTutorialTarget && tutorialStage === 'tap-category') {
              setTutorialStage('pick-category');
            }
            setPickerVisible(true);
          }}
          style={[
            { borderRadius: 8 },
            isTutorialTarget && tutorialStage === 'tap-category' && { borderWidth: 2, borderColor: c.primary, padding: 3, margin: -5, backgroundColor: c.primaryMuted },
          ]}
        >
          <CategoryBadge category={link.category} />
        </Pressable>
        {link.isDead && (
          <Pressable
            onPress={() => {
              badgePressedRef.current = true;
              const url = link.archiveUrl || `https://web.archive.org/web/*/${link.url}`;
              Linking.openURL(url);
              markAsOpened(link.id);
            }}
            style={[styles.deadBadge, { gap: s.deadGap, paddingHorizontal: s.deadHPad, paddingVertical: s.deadVPad, backgroundColor: c.error + (isDark ? '33' : '20') }]}
          >
            <Unlink size={s.deadSize} color={c.error} />
            <Text style={[styles.deadText, { fontSize: s.deadSize, color: c.error }]}>{t('linkCard.dead')}</Text>
          </Pressable>
        )}
      </View>

      {link.metadata.thumbnail ? (
        <Image source={{ uri: link.metadata.thumbnail }} style={[styles.thumbnail, { height: s.thumbHeight, marginBottom: s.thumbMb, backgroundColor: c.border }]} />
      ) : (
        <View style={[styles.placeholder, { height: s.thumbHeight, marginBottom: s.thumbMb, backgroundColor: c.border }]}>
          <PlatformIcon size={s.placeholderIcon} color={c.textMuted} />
        </View>
      )}

      <Text style={[styles.title, { fontSize: s.titleSize, marginBottom: s.titleMb, color: c.text }]} numberOfLines={2}>
        {link.metadata.title}
      </Text>

      {link.metadata.description && (
        <Text style={[styles.description, { fontSize: s.descSize, marginBottom: s.descMb, color: c.textMuted }]} numberOfLines={2}>
          {link.metadata.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.platformRow}>
          <PlatformIcon size={s.platformSize} color={c.textMuted} />
          <Text style={[styles.platform, { fontSize: s.platformSize, color: c.textMuted }]}>{PLATFORM_LABELS[link.platform]}</Text>
        </View>
        {!selectionMode && (
          <View style={[styles.actions, { gap: s.actionGap }]}>
            <Pressable onPress={(e) => { e.stopPropagation(); hapticFavorite(); toggleFavorite(link.id); }} style={{ padding: s.actionPad }}>
              <Star size={s.iconSize} color={link.isFavorite ? c.warning : c.textMuted} fill={link.isFavorite ? c.warning : 'none'} />
            </Pressable>
            {(link.snapshot || isReadablePlatform) && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/link/${link.id}`);
                }}
                style={{ padding: s.actionPad }}
              >
                <BookOpenText size={s.iconSize} color={link.snapshot ? c.primary : c.textMuted} />
              </Pressable>
            )}
            <Pressable onPress={(e) => { e.stopPropagation(); handleDelete(); }} style={{ padding: s.actionPad }}>
              <Trash2 size={s.iconSize} color={c.textMuted} />
            </Pressable>
          </View>
        )}
      </View>
      <CategoryPicker
        visible={pickerVisible}
        current={link.category}
        tutorialTargetCategory={isTutorialTarget && tutorialStage === 'pick-category' ? tutorialCategoryTarget : undefined}
        onSelect={(cat) => {
          updateLinkCategory(link.id, cat);
          if (isTutorialTarget && tutorialStage === 'pick-category') {
            setTutorialStage('done');
          }
        }}
        onClose={closePicker}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: '100%', borderRadius: 6 },
  placeholder: { width: '100%', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '600' },
  description: {},
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  platformRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  platform: {},
  actions: { flexDirection: 'row' },
  deadBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6 },
  deadText: { fontWeight: '500' },
});
