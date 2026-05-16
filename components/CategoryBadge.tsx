import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GraduationCap, Music, Code2, Newspaper, Shuffle, Tag } from 'lucide-react-native';
import { useCategoryStore } from '@/store/categoryStore';

const DEFAULT_ICONS: Record<string, typeof Tag> = {
  education: GraduationCap,
  entertainment: Music,
  code: Code2,
  news: Newspaper,
  random: Shuffle,
};

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const cat = useCategoryStore((s) => s.getCategory(category));
  const color = cat?.color || '#94a3b8';
  const Icon = DEFAULT_ICONS[category] || Tag;

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Icon size={12} color={color} />
      <Text style={[styles.text, { color }]}>{cat?.name || category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
