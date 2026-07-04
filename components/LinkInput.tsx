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
import { COLORS } from '@/utils/constants';
import { TUTORIAL_SAMPLE_URL, useLinkStore } from '@/store/linkStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { hapticSave } from '@/utils/haptics';

export function LinkInput() {
  const [url, setUrl] = useState('');
  const { addLink, addSampleLink, isLoading } = useLinkStore();
  const tutorialStage = useTutorialStore((s) => s.stage);
  const setTutorialStage = useTutorialStore((s) => s.setStage);
  const setSampleLinkId = useTutorialStore((s) => s.setSampleLinkId);
  const isTutorialPasteTarget = tutorialStage === 'paste-link';

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
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    try {
      await addLink(url);
      hapticSave();
      setUrl('');
      Alert.alert('Success', 'Link saved successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save link');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Paste link here"
          placeholderTextColor={COLORS.textMuted}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.pasteButton, isTutorialPasteTarget && styles.tutorialPasteFocus]}
          onPress={handlePaste}
          disabled={isLoading}
        >
          <ClipboardPaste size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <View style={styles.saveButtonContent}>
            <Save size={20} color={COLORS.background} />
            <Text style={styles.saveButtonText}>Save Link</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  pasteButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialPasteFocus: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '14',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
