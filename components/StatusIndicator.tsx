import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { LinkStatus } from '@/store/types';
import { COLORS } from '@/utils/constants';

interface StatusIndicatorProps {
  status: LinkStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  useThemeStore((s) => s.themeId);
  const c = COLORS;
  const color = status === 'unread' ? c.primary : status === 'watched' ? c.success : c.secondary;
  return <View style={[styles.indicator, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  indicator: { width: 8, height: 8, borderRadius: 4 },
});
