import React, { useState } from 'react';
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
import { Star, Trash2, Unlink, Film, MessageCircle, MessageSquare, Code2, Camera, BookOpen, FileText, Globe, Eye, BookmarkPlus, CheckCircle2, Square, CheckSquare, Tv, Headphones, Music, Briefcase } from 'lucide-react-native';
import { SavedLink, LinkPlatform, LinkStatus, CardSize } from '@/store/types';
import { COLORS } from '@/utils/constants';
import { CategoryBadge } from './CategoryBadge';
import { CategoryPicker } from './CategoryPicker';
import { useLinkStore } from '@/store/linkStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTutorialStore } from '@/store/tutorialStore';

const PLATFORM_ICONS: Record<LinkPlatform, typeof Film> = {
  youtube: Film,
  reddit: MessageCircle,
  twitter: MessageSquare,
  github: Code2,
  instagram: Camera,
  medium: BookOpen,
  article: FileText,
  unknown: Globe,
  twitch: Tv,
  discord: Headphones,
  spotify: Music,
  linkedin: Briefcase,
};

const PLATFORM_LABELS: Record<LinkPlatform, string> = {
  youtube: 'Video',
  reddit: 'Post',
  twitter: 'Tweet',
  github: 'Repo',
  instagram: 'Post',
  medium: 'Article',
  article: 'Blog',
  unknown: 'Link',
  twitch: 'Stream',
  discord: 'Chat',
  spotify: 'Music',
  linkedin: 'Profile',
};

const STATUS_ICONS: Record<LinkStatus, typeof Eye> = {
  unread: Eye,
  watched: CheckCircle2,
  saved: BookmarkPlus,
};

const STATUS_COLORS: Record<LinkStatus, string> = {
  unread: COLORS.primary,
  watched: COLORS.success,
  saved: COLORS.secondary,
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
  const { softDelete, toggleFavorite, markAsOpened, updateStatus, updateLinkCategory } = useLinkStore();
  const cardSize = useSettingsStore((s) => s.cardSize);
  const tutorialStage = useTutorialStore((s) => s.stage);
  const tutorialSampleLinkId = useTutorialStore((s) => s.sampleLinkId);
  const setTutorialStage = useTutorialStore((s) => s.setStage);
  const s = SIZE_MAP[cardSize];
  const [pickerVisible, setPickerVisible] = useState(false);
  const isTutorialTarget = tutorialSampleLinkId === link.id;
  const tutorialCategoryTarget = link.category === 'entertainment' ? 'education' : 'entertainment';

  const PlatformIcon = PLATFORM_ICONS[link.platform];
  const StatusIcon = STATUS_ICONS[link.status];

  const closePicker = () => {
    setPickerVisible(false);
    if (isTutorialTarget && useTutorialStore.getState().stage === 'pick-category') {
      setTutorialStage('tap-category');
    }
  };

  const handlePress = async () => {
    if (selectionMode) {
      onToggleSelect?.(link.id);
      return;
    }
    if (link.isDead && link.archiveUrl) {
      Alert.alert(
        'Dead Link',
        'This link is no longer available. Open archived version?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Archive',
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
        base.card,
        isSelected && base.cardSelected,
        {
          padding: s.cardPadding,
          marginVertical: s.cardMarginV,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[base.header, { gap: s.headerGap, marginBottom: s.headerMb }]}>
        {selectionMode && (
          <Pressable onPress={(e) => { e.stopPropagation(); onToggleSelect?.(link.id); }} hitSlop={8}>
            {isSelected ? (
              <CheckSquare size={s.statusSize} color={COLORS.primary} />
            ) : (
              <Square size={s.statusSize} color={COLORS.textMuted} />
            )}
          </Pressable>
        )}
        <Pressable onPress={(e) => { e.stopPropagation(); cycleStatus(); }} hitSlop={8}>
          <StatusIcon size={s.statusSize} color={STATUS_COLORS[link.status]} />
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
            base.categoryPressable,
            isTutorialTarget && tutorialStage === 'tap-category' && base.tutorialCategoryFocus,
          ]}
        >
          <CategoryBadge category={link.category} />
        </Pressable>
        {link.isDead && (
          <View style={[base.deadBadge, { gap: s.deadGap, paddingHorizontal: s.deadHPad, paddingVertical: s.deadVPad }]}>
            <Unlink size={s.deadSize} color={COLORS.error} />
            <Text style={[base.deadText, { fontSize: s.deadSize }]}>Dead</Text>
          </View>
        )}
      </View>

      {link.metadata.thumbnail ? (
        <Image source={{ uri: link.metadata.thumbnail }} style={[base.thumbnail, { height: s.thumbHeight, marginBottom: s.thumbMb }]} />
      ) : (
        <View style={[base.placeholder, { height: s.thumbHeight, marginBottom: s.thumbMb }]}>
          <PlatformIcon size={s.placeholderIcon} color={COLORS.textMuted} />
        </View>
      )}

      <Text style={[base.title, { fontSize: s.titleSize, marginBottom: s.titleMb }]} numberOfLines={2}>
        {link.metadata.title}
      </Text>

      {link.metadata.description && (
        <Text style={[base.description, { fontSize: s.descSize, marginBottom: s.descMb }]} numberOfLines={2}>
          {link.metadata.description}
        </Text>
      )}

      <View style={base.footer}>
        <View style={base.platformRow}>
          <PlatformIcon size={s.platformSize} color={COLORS.textMuted} />
          <Text style={[base.platform, { fontSize: s.platformSize }]}>{PLATFORM_LABELS[link.platform]}</Text>
        </View>
        {!selectionMode && (
          <View style={[base.actions, { gap: s.actionGap }]}>
            <Pressable onPress={(e) => { e.stopPropagation(); toggleFavorite(link.id); }} style={[base.actionButton, { padding: s.actionPad }]}>
              <Star size={s.iconSize} color={link.isFavorite ? COLORS.warning : COLORS.textMuted} fill={link.isFavorite ? COLORS.warning : 'none'} />
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation(); handleDelete(); }} style={[base.actionButton, { padding: s.actionPad }]}>
              <Trash2 size={s.iconSize} color={COLORS.textMuted} />
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

const base = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPressable: {
    borderRadius: 8,
  },
  tutorialCategoryFocus: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 3,
    margin: -5,
    backgroundColor: COLORS.primary + '14',
  },
  thumbnail: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  placeholder: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    color: COLORS.text,
  },
  description: {
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platform: {
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {},
  deadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    borderRadius: 6,
  },
  deadText: {
    fontWeight: '500',
    color: COLORS.error,
  },
});
