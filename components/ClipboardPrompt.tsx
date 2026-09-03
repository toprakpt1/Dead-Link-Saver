import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, AppState, ActivityIndicator, Alert } from 'react-native';
import { Bookmark, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/utils/constants';
import { useLinkStore } from '@/store/linkStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { extractUrls, canonicalKey } from '@/services/linkParser';
import { hapticSave } from '@/utils/haptics';

// Per-session guards so we never nag twice about the same URL / clipboard content
const promptedUrls = new Set<string>();
let lastClipboardContent = '';

export function ClipboardPrompt() {
  const { t } = useTranslation();
  const c = COLORS;
  const [candidate, setCandidate] = useState<{ url: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const checkingRef = useRef(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const schedule = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      fn();
    }, ms);
    timersRef.current.add(timer);
  };

  const close = () => {
    setSaving(false);
    setCandidate(null);
  };

  const maybeCheck = async () => {
    if (checkingRef.current) return;
    const stage = useTutorialStore.getState().stage;
    if (stage !== 'idle' && stage !== 'done') return;

    checkingRef.current = true;
    try {
      const raw = await Clipboard.getStringAsync();
      const content = (raw ?? '').trim();
      if (!content) return;
      // Only react when the clipboard content actually changed
      if (content === lastClipboardContent) return;
      lastClipboardContent = content;

      const url = extractUrls(content)[0];
      if (!url) return;
      if (promptedUrls.has(url)) return;
      promptedUrls.add(url);

      const links = useLinkStore.getState().links;
      const exists = links.some((link) => canonicalKey(link.url) === canonicalKey(url));
      if (exists) return;

      setCandidate({ url });
    } catch {
      // Clipboard reads can fail — ignore silently
    } finally {
      checkingRef.current = false;
    }
  };

  useEffect(() => {
    const firstTimer = setTimeout(() => void maybeCheck(), 1500);
    timersRef.current.add(firstTimer);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        schedule(() => void maybeCheck(), 400);
      }
    });

    return () => {
      clearTimeout(firstTimer);
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!candidate) return;
    setSaving(true);
    try {
      await useLinkStore.getState().addLink(candidate.url);
      hapticSave();
      close();
    } catch (error) {
      close();
      const msg = error instanceof Error ? error.message : undefined;
      if (msg && msg.includes('already')) {
        // Same link appeared while the prompt was open — that's fine
        return;
      }
      Alert.alert(t('common.error'), t('linkInput.failed'));
    } finally {
      setSaving(false);
    }
  };

  const host = candidate
    ? (() => {
        try {
          return new URL(candidate.url).host.replace('www.', '');
        } catch {
          return candidate.url;
        }
      })()
    : '';

  return (
    <Modal visible={candidate !== null} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.overlay} onPress={close}>
        <View style={[styles.sheet, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, { backgroundColor: c.primaryMuted }]}>
              <Bookmark size={22} color={c.primary} />
            </View>
            <Pressable onPress={close} hitSlop={8} style={styles.closeBtn}>
              <X size={18} color={c.textMuted} />
            </Pressable>
          </View>
          <Text style={[styles.title, { color: c.text }]}>{t('clipboard.title')}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{t('clipboard.subtitle')}</Text>

          <View style={[styles.preview, { backgroundColor: c.background, borderColor: c.border }]}>
            <Text style={[styles.previewHost, { color: c.text }]} numberOfLines={1}>
              {host || candidate?.url}
            </Text>
            <Text style={[styles.previewUrl, { color: c.textMuted }]} numberOfLines={1}>
              {candidate?.url}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={close}
              disabled={saving}
              style={[styles.secondaryBtn, { borderColor: c.border }]}
            >
              <Text style={[styles.secondaryText, { color: c.textMuted }]}>{t('clipboard.notNow')}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.primaryBtn, { backgroundColor: c.primary }, saving && { opacity: 0.6 }]}
            >
              {saving ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <Text style={[styles.primaryText, { color: c.onPrimary }]}>{t('clipboard.save')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 28,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '800', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#94a3b8' },
  preview: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  previewHost: { fontSize: 15, fontWeight: '600' },
  previewUrl: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 15, fontWeight: '700' },
});
