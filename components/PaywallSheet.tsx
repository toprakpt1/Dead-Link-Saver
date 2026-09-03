import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Crown, Check, X, Zap, HardDrive, Ban } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/utils/constants';
import { useThemeStore } from '@/store/themeStore';
import { useEntitlementStore } from '@/store/entitlementStore';

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  feature?: 'check' | 'backup' | 'general';
}

export function PaywallSheet({ visible, onClose, feature = 'general' }: PaywallSheetProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const purchasePro = useEntitlementStore((s) => s.purchasePro);
  const restorePurchases = useEntitlementStore((s) => s.restorePurchases);
  const isDark = useThemeStore((s) => s.theme.isDark);
  const c = COLORS;

  const headline = feature === 'check' ? t('paywall.headlineCheck') : feature === 'backup' ? t('paywall.headlineBackup') : t('paywall.headlineGeneral');

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const ok = await purchasePro();
      if (ok) {
        Alert.alert(t('paywall.activeTitle'), t('paywall.activeBody'));
        onClose();
      }
    } catch (e) {
      console.log('[paywall] purchase error', e);
      Alert.alert(t('common.error'), t('paywall.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const isPro = await restorePurchases();
      Alert.alert(isPro ? t('paywall.restoredTitle') : t('paywall.notFoundTitle'), isPro ? t('paywall.restoredBody') : t('paywall.notFoundBody'));
      if (isPro) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={c.textMuted} />
          </Pressable>

          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)' }]}>
            <Crown size={32} color={c.warning} />
          </View>

          <Text style={[styles.title, { color: c.text }]}>{headline}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{t('paywall.subtitle')}</Text>

          <View style={styles.features}>
            <View style={[styles.featureRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: c.primaryMuted }]}>
                <Zap size={16} color={c.primary} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: c.text }]}>{t('paywall.featureCheckTitle')}</Text>
                <Text style={[styles.featureDesc, { color: c.textMuted }]}>{t('paywall.featureCheckDesc')}</Text>
              </View>
              <Check size={18} color={c.success} />
            </View>

            <View style={[styles.featureRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)' }]}>
                <HardDrive size={16} color={c.success} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: c.text }]}>{t('paywall.featureBackupTitle')}</Text>
                <Text style={[styles.featureDesc, { color: c.textMuted }]}>{t('paywall.featureBackupDesc')}</Text>
              </View>
              <Check size={18} color={c.success} />
            </View>

            <View style={[styles.featureRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)' }]}>
                <Ban size={16} color={c.warning} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: c.text }]}>{t('paywall.featureAdFreeTitle')}</Text>
                <Text style={[styles.featureDesc, { color: c.textMuted }]}>{t('paywall.featureAdFreeDesc')}</Text>
              </View>
              <Check size={18} color={c.success} />
            </View>
          </View>

          <Pressable onPress={handlePurchase} disabled={loading} style={[styles.buyBtn, { backgroundColor: c.primary }, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyText}>{t('paywall.buy')}</Text>}
          </Pressable>

          <Text style={[styles.priceNote, { color: c.textMuted }]}>{t('paywall.priceNote')}</Text>

          <Pressable onPress={handleRestore} disabled={loading} style={styles.restoreBtn}>
            <Text style={[styles.restoreText, { color: c.primary }]}>{t('paywall.restore')}</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.laterBtn}>
            <Text style={[styles.laterText, { color: c.textMuted }]}>{t('paywall.later')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 1, gap: 14 },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 6, zIndex: 1 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 4 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  features: { gap: 12, marginTop: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  featureIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  featureTextWrap: { flex: 1, gap: 2 },
  featureTitle: { fontSize: 14, fontWeight: '600' },
  featureDesc: { fontSize: 12 },
  buyBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  buyText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  priceNote: { fontSize: 11, textAlign: 'center' },
  restoreBtn: { alignItems: 'center', paddingVertical: 6 },
  restoreText: { fontSize: 13, fontWeight: '600' },
  laterBtn: { alignItems: 'center', paddingVertical: 6 },
  laterText: { fontSize: 13 },
});
