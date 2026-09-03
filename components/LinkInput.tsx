import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ClipboardPaste, Save } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/utils/constants';
import { TUTORIAL_SAMPLE_URL, useLinkStore } from '@/store/linkStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { useThemeStore } from '@/store/themeStore';
import { hapticSave } from '@/utils/haptics';
import { extractUrls } from '@/services/linkParser';

export function LinkInput() {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);
  const { addLink, addSampleLink, isLoading } = useLinkStore();
  const tutorialStage = useTutorialStore((s) => s.stage);
  const setTutorialStage = useTutorialStore((s) => s.setStage);
  const setSampleLinkId = useTutorialStore((s) => s.setSampleLinkId);
  const isTutorialPasteTarget = tutorialStage === 'paste-link';
  const isDark = useThemeStore((s) => s.theme.isDark);
  const busy = isLoading || batchSaving;
  const c = COLORS;

  const handlePaste = async () => {
    if (isTutorialPasteTarget) {
      setUrl(TUTORIAL_SAMPLE_URL);
      const link = await addSampleLink();
      setSampleLinkId(link.id);
      setTutorialStage('tap-category');
      return;
    }
    const text = await Clipboard.getStringAsync();
    setUrl(text);
  };

  const errorText = (error: unknown) => {
    if (!(error instanceof Error)) return t('linkInput.failed');
    const map: Record<string, string> = {
      'Invalid URL': t('linkInput.errorInvalid'),
      'Link already exists': t('linkInput.errorDuplicate'),
      'A similar link is already saved': t('linkInput.errorSimilarDuplicate'),
    };
    return map[error.message] ?? t('linkInput.failed');
  };

  const saveOne = async (raw: string) => {
    try {
      await addLink(raw);
      hapticSave();
      setUrl('');
      Alert.alert(t('common.success'), t('linkInput.success'));
    } catch (error) {
      Alert.alert(t('common.error'), errorText(error));
    }
  };

  const saveBatch = async (urls: string[]) => {
    setBatchSaving(true);
    let added = 0;
    let skipped = 0;
    let failed = 0;
    for (const raw of urls) {
      try {
        await addLink(raw);
        added += 1;
      } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('already')) {
          skipped += 1;
        } else {
          failed += 1;
        }
      }
    }
    setBatchSaving(false);
    setUrl('');

    const parts: string[] = [];
    if (added > 0) parts.push(t('linkInput.batchAdded', { count: added }));
    if (skipped > 0) parts.push(t('linkInput.batchSkipped', { count: skipped }));
    if (failed > 0) parts.push(t('linkInput.batchFailed', { count: failed }));
    hapticSave();
    Alert.alert(t('common.success'), parts.join('\n'));
  };

  const handleSave = async () => {
    const text = url.trim();
    if (!text) {
      Alert.alert(t('common.error'), t('linkInput.errorEmpty'));
      return;
    }

    const urls = extractUrls(text);
    if (urls.length === 0) {
      Alert.alert(t('common.error'), t('linkInput.errorInvalid'));
      return;
    }

    // A single URL — normal save (prose around the link is fine too)
    if (urls.length === 1) {
      await saveOne(urls[0]);
      return;
    }

    // Multiple URLs found — ask before saving them all
    Alert.alert(
      t('linkInput.multipleFoundTitle'),
      t('linkInput.multipleFound', { count: urls.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('linkInput.saveAll'), onPress: () => void saveBatch(urls) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
          placeholder={t('linkInput.placeholder')}
          placeholderTextColor={c.textMuted}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!busy}
        />
        <TouchableOpacity
          style={[styles.pasteButton, { backgroundColor: c.surface, borderColor: c.border }, isTutorialPasteTarget && { borderWidth: 2, borderColor: c.primary, backgroundColor: c.primaryMuted }]}
          onPress={handlePaste}
          disabled={busy}
        >
          <ClipboardPaste size={20} color={c.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: c.primary }, busy && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={c.onPrimary} />
        ) : (
          <View style={styles.saveButtonContent}>
            <Save size={20} color={c.onPrimary} />
            <Text style={[styles.saveButtonText, { color: c.onPrimary }]}>{t('linkInput.save')}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  inputWrapper: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  pasteButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
});
