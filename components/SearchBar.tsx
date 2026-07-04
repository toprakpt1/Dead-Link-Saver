import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS } from '@/utils/constants';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <Search size={18} color={COLORS.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search links..."
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <X
          size={18}
          color={COLORS.textMuted}
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
  },
  clear: {
    marginLeft: 8,
    padding: 2,
  },
});
