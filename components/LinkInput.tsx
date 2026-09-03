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

export function LinkInput() {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const { addLink, addSampleLink, isLoading } = useLinkStore();
  const tutorialStage = useTutorialStore((s) => s.stage);
  const setTutorialStage = useTutorialStore((s) => s.setStage);
  const setSampleLinkId = useTutorialStore((s) => s.setSampleLinkId);
  const isTutorialPasteTarget = tutorialStage === 'paste-link';
  const isDark = useThemeStore((s) => s.theme.isDark);
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

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert(t('common.error'), t('linkInput.errorEmpty'));
      return;
    }
    try {
      await addLink(url);
      hapticSave();
      setUrl('');
      Alert.alert(t('common.success'), t('linkInput.success'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('linkInput.failed');
      Alert.alert(t('common.error'), msg);
    }
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
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.pasteButton, { backgroundColor: c.surface, borderColor: c.border }, isTutorialPasteTarget && { borderWidth: 2, borderColor: c.primary, backgroundColor: c.primaryMuted }]}
          onPress={handlePaste}
          disabled={isLoading}
        >
          <ClipboardPaste size={20} color={c.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: c.primary }, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
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
