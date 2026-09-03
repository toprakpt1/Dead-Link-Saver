import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpenText, FileText, ExternalLink, Unlink, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLinkStore } from '@/store/linkStore';
import { useThemeStore } from '@/store/themeStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { PLATFORM_LABELS } from '@/utils/platforms';
import { COLORS } from '@/utils/constants';

function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return new Date(timestamp).toDateString();
  }
}

export default function LinkReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const link = useLinkStore((s) => s.links.find((l) => l.id === id));
  const { isConnected } = useNetworkStatus();
  useThemeStore((s) => s.themeId);
  const c = COLORS;
  const [saving, setSaving] = useState(false);

  if (!link) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ title: '' }} />
        <Text style={[styles.missingTitle, { color: c.text }]}>{t('notFound.title')}</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: c.primary }]}>
          <Text style={[styles.backBtnText, { color: c.primary }]}>{t('reader.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const handleSaveCopy = async () => {
    if (saving) return;
    setSaving(true);
    const ok = await useLinkStore.getState().captureSnapshot(link.id);
    setSaving(false);
    if (!ok) {
      Alert.alert(t('common.error'), t('reader.saveFailed'));
    }
  };

  const platformLabel = PLATFORM_LABELS[link.platform];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: link.metadata.title?.slice(0, 40) || platformLabel }} />
      <ScrollView contentContainerStyle={styles.content}>
        {link.isDead && (
          <View style={[styles.deadNote, { backgroundColor: c.error + '18', borderColor: c.error }]}>
            <Unlink size={15} color={c.error} />
            <Text style={[styles.deadNoteText, { color: c.error }]}>{t('reader.deadNote')}</Text>
          </View>
        )}

        <Text style={[styles.articleTitle, { color: c.text }]}>{link.metadata.title}</Text>
        <Text style={[styles.platform, { color: c.textMuted }]} numberOfLines={1}>
          {platformLabel} · {link.url}
        </Text>

        {link.snapshot ? (
          <View style={[styles.copyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.copyHeader, { borderBottomColor: c.border }]}>
              <BookOpenText size={16} color={c.primary} />
              <Text style={[styles.copyHeaderText, { color: c.text }]}>{t('reader.offlineCopy')}</Text>
              <Text style={[styles.copyDate, { color: c.textMuted }]}>
                {t('reader.capturedOn', { date: formatDate(link.snapshot.capturedAt) })}
              </Text>
            </View>
            <Text style={[styles.copyBody, { color: c.text }]}>{link.snapshot.text}</Text>
          </View>
        ) : (
          <View style={[styles.copyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.noCopyIcon, { backgroundColor: c.primaryMuted }]}>
              <FileText size={22} color={c.primary} />
            </View>
            <Text style={[styles.noCopyTitle, { color: c.text }]}>{t('reader.noCopyTitle')}</Text>
            <Text style={[styles.noCopyDesc, { color: c.textMuted }]}>{t('reader.noCopyDesc')}</Text>
            <Pressable
              onPress={handleSaveCopy}
              disabled={saving || !isConnected}
              style={[
                styles.saveCopyBtn,
                { backgroundColor: c.primary },
                (saving || !isConnected) && { opacity: 0.6 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <>
                  <Download size={16} color={c.onPrimary} />
                  <Text style={[styles.saveCopyText, { color: c.onPrimary }]}>{t('reader.saveCopy')}</Text>
                </>
              )}
            </Pressable>
            {!isConnected && (
              <Text style={[styles.offlineHint, { color: c.textMuted }]}>{t('reader.offlineHint')}</Text>
            )}
          </View>
        )}

        <Pressable
          onPress={() => {
            Linking.openURL(link.url);
          }}
          style={[styles.openBtn, { borderColor: c.primary }]}
        >
          <ExternalLink size={16} color={c.primary} />
          <Text style={[styles.openBtnText, { color: c.primary }]}>{t('reader.openOriginal')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16 },
  missingTitle: { fontSize: 17, fontWeight: '600' },
  backBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  deadNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  deadNoteText: { flex: 1, fontSize: 12, fontWeight: '600' },
  articleTitle: { fontSize: 22, fontWeight: '800', lineHeight: 29 },
  platform: { fontSize: 12, marginBottom: 6 },
  copyCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  copyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
  },
  copyHeaderText: { fontSize: 14, fontWeight: '700' },
  copyDate: { marginLeft: 'auto', fontSize: 11 },
  copyBody: { padding: 14, fontSize: 15, lineHeight: 24 },
  noCopyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 18,
  },
  noCopyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  noCopyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  saveCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
  },
  saveCopyText: { fontSize: 15, fontWeight: '700' },
  offlineHint: { fontSize: 12, textAlign: 'center', marginBottom: 18, marginTop: -10 },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  openBtnText: { fontSize: 14, fontWeight: '700' },
});
