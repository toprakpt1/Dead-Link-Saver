import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Columns2, Columns3, AlignJustify, Trash2, Plus, RotateCw } from 'lucide-react-native';
import { CardSize } from '@/store/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useLinkStore } from '@/store/linkStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { COLORS, STORAGE_KEYS } from '@/utils/constants';
import { hapticDelete } from '@/utils/haptics';

const SIZES: { key: CardSize; label: string; icon: typeof Columns2 }[] = [
  { key: 'small', label: 'Small', icon: Columns3 },
  { key: 'medium', label: 'Medium', icon: Columns2 },
  { key: 'large', label: 'Large', icon: AlignJustify },
];

export default function SettingsScreen() {
  const router = useRouter();
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

    const links = useLinkStore.getState().links;
    const linksInCategory = links.filter((l) => l.category === id);

    if (linksInCategory.length === 0) {
      removeCategory(id);
      return;
    }

    const linkIds = linksInCategory.map((l) => l.id);

    Alert.alert(
      'Delete Category',
      `"${name}" has ${linksInCategory.length} link${linksInCategory.length > 1 ? 's' : ''}. What should happen to them?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Random',
          onPress: () => {
            useLinkStore.getState().batchUpdateCategory(linkIds, 'random');
            removeCategory(id);
          },
        },
        {
          text: 'Delete Links',
          style: 'destructive',
          onPress: () => {
            hapticDelete();
            useLinkStore.getState().batchDelete(linkIds);
            removeCategory(id);
          },
        },
      ]
    );
  };

  const handleReplayTutorial = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    const { reset, setStage } = useTutorialStore.getState();
    reset();
    router.replace('/(tabs)');
    setStage('ask');
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tutorial</Text>
        <Text style={styles.sectionSub}>Replay the onboarding tutorial</Text>
        <Pressable style={styles.replayButton} onPress={handleReplayTutorial}>
          <RotateCw size={16} color={COLORS.primary} />
          <Text style={styles.replayButtonText}>Show Tutorial Again</Text>
        </Pressable>
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
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
  },
  replayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
