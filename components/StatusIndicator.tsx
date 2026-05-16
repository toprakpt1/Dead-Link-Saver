import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinkStatus } from '@/store/types';
import { COLORS } from '@/utils/constants';

interface StatusIndicatorProps {
  status: LinkStatus;
}

const STATUS_COLORS: Record<LinkStatus, string> = {
  unread: COLORS.primary,
  watched: COLORS.success,
  saved: COLORS.secondary,
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return <View style={[styles.indicator, { backgroundColor: STATUS_COLORS[status] }]} />;
}

const styles = StyleSheet.create({
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
