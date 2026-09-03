import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { COLORS } from '@/utils/constants';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();
  const isDark = useThemeStore((s) => s.theme.isDark);
  const c = COLORS;
  if (isConnected) return null;
  return (
    <View style={[styles.banner, { backgroundColor: c.warning + (isDark ? '33' : '20'), borderBottomColor: c.warning }]}>
      <WifiOff size={14} color={c.warning} />
      <Text style={[styles.text, { color: c.warning }]}>{t('offline.noInternet')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
