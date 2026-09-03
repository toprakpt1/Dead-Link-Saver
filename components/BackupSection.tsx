import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { HardDrive, Upload, Download, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/utils/constants';
import { useEntitlementStore } from '@/store/entitlementStore';
import { useThemeStore } from '@/store/themeStore';
import { shareBackup, pickAndRestoreBackup } from '@/services/backup';
import { useLinkStore } from '@/store/linkStore';

interface BackupSectionProps {
  onNeedGate: (type: 'backup') => void;
  onNeedPro: () => void;
}

export function BackupSection({ onNeedGate, onNeedPro }: BackupSectionProps) {
  const { t } = useTranslation();
  const isPro = useEntitlementStore((s) => s.isPro);
  const canBackupValue = useEntitlementStore((s) => s.canBackup());
  const remaining = useEntitlementStore((s) => s.getRemainingBackups());
  const consumeBackup = useEntitlementStore((s) => s.consumeBackup);
  const loadLinks = useLinkStore((s) => s.loadLinks);
  const isDark = useThemeStore((s) => s.theme.isDark);
  const c = COLORS;

  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const handleExport = async () => {
    if (!isPro && !canBackupValue) {
      onNeedGate('backup');
      return;
    }
    setBusy('export');
    try {
      await shareBackup();
      if (!isPro) await consumeBackup();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('backup.errorCreate');
      Alert.alert(t('common.error'), msg);
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy('import');
    try {
      const result = await pickAndRestoreBackup();
      if (result.imported === 0 && result.skipped === 0) return;
      await loadLinks();
      Alert.alert(t('backup.restoredTitle'), t('backup.restoredBody', { imported: result.imported, skipped: result.skipped }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('backup.errorRestore');
      Alert.alert(t('common.error'), msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.headerRow}>
        <HardDrive size={18} color={c.primary} />
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t('backup.title')}</Text>
        {isPro ? (
          <View style={[styles.proBadge, { backgroundColor: c.primary }]}>
            <Crown size={12} color="#fff" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        ) : (
          <Text style={[styles.quotaText, { color: c.textMuted }]}>{remaining === Infinity ? t('backup.quotaUnlimited') : t('backup.quotaWeekly', { remaining })}</Text>
        )}
      </View>

      <Text style={[styles.desc, { color: c.textMuted }]}>{t('backup.desc')}</Text>

      <View style={styles.row}>
        <Pressable onPress={handleExport} disabled={busy !== null} style={[styles.btn, { backgroundColor: c.primary }]}>
          {busy === 'export' ? <ActivityIndicator color="#fff" size="small" /> : <Upload size={16} color="#fff" />}
          <Text style={styles.primaryText}>{t('backup.export')}</Text>
        </Pressable>

        <Pressable onPress={handleImport} disabled={busy !== null} style={[styles.btn, { borderColor: c.primary, backgroundColor: 'transparent', borderWidth: 1 }]}>
          {busy === 'import' ? <ActivityIndicator color={c.primary} size="small" /> : <Download size={16} color={c.primary} />}
          <Text style={[styles.secondaryText, { color: c.primary }]}>{t('backup.import')}</Text>
        </Pressable>
      </View>

      {!isPro && !canBackupValue && (
        <Pressable onPress={onNeedPro} style={styles.proCta}>
          <Crown size={14} color={c.primary} />
          <Text style={[styles.proCtaText, { color: c.primary }]}>{t('backup.proCta')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, marginHorizontal: 16, marginTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  proBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  quotaText: { fontSize: 12 },
  desc: { fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  secondaryText: { fontWeight: '700', fontSize: 13 },
  proCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  proCtaText: { fontSize: 13, fontWeight: '600' },
});
