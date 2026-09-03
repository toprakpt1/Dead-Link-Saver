import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { HardDrive, Upload, Download, Crown } from 'lucide-react-native';
import { COLORS } from '@/utils/constants';
import { useEntitlementStore } from '@/store/entitlementStore';
import { shareBackup, pickAndRestoreBackup } from '@/services/backup';
import { useLinkStore } from '@/store/linkStore';

interface BackupSectionProps {
  onNeedGate: (type: 'backup') => void;
  onNeedPro: () => void;
}

export function BackupSection({ onNeedGate, onNeedPro }: BackupSectionProps) {
  const isPro = useEntitlementStore((s) => s.isPro);
  const canBackupValue = useEntitlementStore((s) => s.canBackup());
  const remaining = useEntitlementStore((s) => s.getRemainingBackups());
  const consumeBackup = useEntitlementStore((s) => s.consumeBackup);
  const loadLinks = useLinkStore((s) => s.loadLinks);

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
      const msg = e instanceof Error ? e.message : 'Yedek oluşturulamadı';
      Alert.alert('Hata', msg);
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
      Alert.alert('Geri yüklendi', `${result.imported} link içe aktarıldı, ${result.skipped} atlandı (zaten var).`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Geri yükleme başarısız';
      Alert.alert('Hata', msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <HardDrive size={18} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Yedekleme</Text>
        {isPro ? (
          <View style={styles.proBadge}>
            <Crown size={12} color="#fff" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        ) : (
          <Text style={styles.quotaText}>{remaining === Infinity ? 'Sınırsız' : `Haftalık hak: ${remaining}/1`}</Text>
        )}
      </View>

      <Text style={styles.desc}>Linklerini JSON olarak dışa aktar, başka cihazda geri yükle. Pro'da sınırsız.</Text>

      <View style={styles.row}>
        <Pressable onPress={handleExport} disabled={busy !== null} style={[styles.btn, styles.primaryBtn]}>
          {busy === 'export' ? <ActivityIndicator color="#fff" size="small" /> : <Upload size={16} color="#fff" />}
          <Text style={styles.primaryText}>Yedeği Paylaş / Dışa Aktar</Text>
        </Pressable>

        <Pressable onPress={handleImport} disabled={busy !== null} style={[styles.btn, styles.secondaryBtn]}>
          {busy === 'import' ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Download size={16} color={COLORS.primary} />}
          <Text style={styles.secondaryText}>Yedeği İçe Aktar</Text>
        </Pressable>
      </View>

      {!isPro && !canBackupValue && (
        <Pressable onPress={onNeedPro} style={styles.proCta}>
          <Crown size={14} color={COLORS.primary} />
          <Text style={styles.proCtaText}>Sınırsız yedek için Pro al</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  quotaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  proCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  proCtaText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
