import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { Columns2, Columns3, AlignJustify, Trash2, Plus } from 'lucide-react-native';
import { CardSize } from '@/store/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useCategoryStore } from '@/store/categoryStore';
import { COLORS } from '@/utils/constants';

const SIZES: { key: CardSize; label: string; icon: typeof Columns2 }[] = [
  { key: 'small', label: 'Small', icon: Columns3 },
  { key: 'medium', label: 'Medium', icon: Columns2 },
  { key: 'large', label: 'Large', icon: AlignJustify },
];

export default function SettingsScreen() {
  const { cardSize, setCardSize, loadSettings, loaded } = useSettingsStore();
  const { categories, loadCategories, addCategory, removeCategory } = useCategoryStore();
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!loaded) loadSettings();
    loadCategories();
  }, []);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addCategory(name);
    setNewName('');
  };

  const handleRemove = (id: string, name: string) => {
    if (id === 'random') return;
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeCategory(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Size</Text>
        <Text style={styles.sectionSub}>Adjust the size of link cards in the list</Text>
        <View style={styles.options}>
          {SIZES.map(({ key, label, icon: Icon }) => {
            const selected = cardSize === key;
            return (
              <Pressable
                key={key}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => setCardSize(key)}
              >
                <Icon size={20} color={selected ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Text style={styles.sectionSub}>Manage your link categories</Text>

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="New category name"
            placeholderTextColor={COLORS.textMuted}
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
          />
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Plus size={18} color={COLORS.background} />
          </Pressable>
        </View>

        <View style={styles.categoryList}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              {cat.id !== 'random' && (
                <Pressable onPress={() => handleRemove(cat.id, cat.name)} style={styles.deleteButton}>
                  <Trash2 size={16} color={COLORS.textMuted} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryList: {
    gap: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
  },
});
