import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCategoryStore } from '@/store/categoryStore';
import { useThemeStore } from '@/store/themeStore';
import { COLORS } from '@/utils/constants';

interface CategoryPickerProps {
  visible: boolean;
  current: string;
  onSelect: (category: string) => void;
  onClose: () => void;
  tutorialTargetCategory?: string;
}

export function CategoryPicker({ visible, current, onSelect, onClose, tutorialTargetCategory }: CategoryPickerProps) {
  const { t } = useTranslation();
  const categories = useCategoryStore((s) => s.categories);
  const isDark = useThemeStore((s) => s.theme.isDark);
  const c = COLORS;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: c.surface }]}>
          <Text style={[styles.title, { color: c.text }]}>{t('categoryPicker.title')}</Text>
          {categories.map((cat) => {
            const selected = cat.id === current;
            const tutorialTarget = cat.id === tutorialTargetCategory;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.row,
                  selected && { backgroundColor: cat.color + (isDark ? '33' : '20') },
                  tutorialTarget && { backgroundColor: c.primaryMuted },
                  tutorialTarget && { borderColor: cat.color },
                ]}
                onPress={() => {
                  onSelect(cat.id);
                  onClose();
                }}
              >
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={[styles.label, { color: c.text }, selected && { color: cat.color, fontWeight: '600' }]}>
                  {cat.name}
                </Text>
                {selected && <Text style={[styles.check, { color: cat.color }]}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16, paddingBottom: 32 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontSize: 15 },
  check: { fontSize: 16, fontWeight: '700' },
});
