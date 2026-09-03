import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/utils/constants';
import { useThemeStore } from '@/store/themeStore';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.theme.isDark);
  const c = COLORS;
  return (
    <View style={[styles.wrapper, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Search size={18} color={c.textMuted} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: c.text }]}
        placeholder={t('search.placeholder')}
        placeholderTextColor={c.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <X
          size={18}
          color={c.textMuted}
          onPress={() => onChangeText('')}
          style={styles.clear}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10, fontSize: 15 },
  clear: { marginLeft: 8, padding: 2 },
});
