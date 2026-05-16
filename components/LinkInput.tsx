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
import { useLinkStore } from '@/store/linkStore';

export function LinkInput() {
  const [url, setUrl] = useState('');
  const { addLink, isLoading } = useLinkStore();

  const handlePaste = async () => {
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
        <TouchableOpacity style={styles.pasteButton} onPress={handlePaste} disabled={isLoading}>
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
