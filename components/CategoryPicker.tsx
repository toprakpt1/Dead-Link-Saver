import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useCategoryStore } from '@/store/categoryStore';
import { COLORS } from '@/utils/constants';

interface CategoryPickerProps {
  visible: boolean;
  current: string;
  onSelect: (category: string) => void;
  onClose: () => void;
  tutorialTargetCategory?: string;
}

export function CategoryPicker({ visible, current, onSelect, onClose, tutorialTargetCategory }: CategoryPickerProps) {
  const categories = useCategoryStore((s) => s.categories);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Change Category</Text>
          {categories.map((cat) => {
            const selected = cat.id === current;
            const tutorialTarget = cat.id === tutorialTargetCategory;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.row,
                  selected && { backgroundColor: cat.color + '20' },
                  tutorialTarget && styles.tutorialTarget,
                  tutorialTarget && { borderColor: cat.color },
                ]}
                onPress={() => {
                  onSelect(cat.id);
                  onClose();
                }}
              >
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={[styles.label, selected && { color: cat.color, fontWeight: '600' }]}>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  check: {
    fontSize: 16,
    fontWeight: '700',
  },
  tutorialTarget: {
    backgroundColor: COLORS.primary + '12',
  },
});
