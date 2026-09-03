import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Crown, Check, X, Zap, HardDrive, Ban } from 'lucide-react-native';
import { COLORS } from '@/utils/constants';
import { useEntitlementStore } from '@/store/entitlementStore';

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  feature?: 'check' | 'backup' | 'general';
}

export function PaywallSheet({ visible, onClose, feature = 'general' }: PaywallSheetProps) {
  const [loading, setLoading] = useState(false);
  const purchasePro = useEntitlementStore((s) => s.purchasePro);
  const restorePurchases = useEntitlementStore((s) => s.restorePurchases);

  const headline =
    feature === 'check'
      ? 'Sınırsız Dead Link taraması'
      : feature === 'backup'
        ? 'Sınırsız yedekleme'
        : 'Dead Link Saver Pro';

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const ok = await purchasePro();
      if (ok) {
        Alert.alert('Pro aktif!', 'Reklamsız ve sınırsız erişimin açıldı.');
        onClose();
      }
    } catch (e) {
      console.log('[paywall] purchase error', e);
      Alert.alert('Hata', 'Satın alma başlatılamadı. Tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const isPro = await restorePurchases();
      Alert.alert(isPro ? 'Geri yüklendi' : 'Abonelik bulunamadı', isPro ? 'Pro erişimin geri yüklendi.' : 'Aktif Pro aboneliği bulunamadı.');
      if (isPro) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={COLORS.textMuted} />
          </Pressable>

          <View style={styles.iconWrap}>
            <Crown size={32} color="#f59e0b" />
          </View>

          <Text style={styles.title}>{headline}</Text>
          <Text style={styles.subtitle}>Tek ödeme değil, dilediğin zaman iptal. Mevcut tüm özelliklerin bedava kalır.</Text>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(108,142,255,0.15)' }]}>
                <Zap size={16} color={COLORS.primary} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>Sınırsız Dead Link taraması</Text>
                <Text style={styles.featureDesc}>Günde 1 yerine dilediğin kadar tara, bekleme yok</Text>
              </View>
              <Check size={18} color={COLORS.success} />
            </View>

            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <HardDrive size={16} color={COLORS.success} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>Sınırsız yedek & dışa aktar</Text>
                <Text style={styles.featureDesc}>Haftada 1 yerine sınırsız, JSON/CSV</Text>
              </View>
              <Check size={18} color={COLORS.success} />
            </View>

            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Ban size={16} color={COLORS.warning} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>Tamamen reklamsız</Text>
                <Text style={styles.featureDesc}>Ödüllü reklam butonları tamamen kalkar</Text>
              </View>
              <Check size={18} color={COLORS.success} />
            </View>
          </View>

          <Pressable onPress={handlePurchase} disabled={loading} style={[styles.buyBtn, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyText}>Pro'yu başlat</Text>}
          </Pressable>

          <Text style={styles.priceNote}>Test modunda tek tıkla aktif olur. Gerçek ödeme RevenueCat ile.</Text>

          <Pressable onPress={handleRestore} disabled={loading} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>Satın almayı geri yükle</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.laterBtn}>
            <Text style={styles.laterText}>Şimdilik devam et</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 1,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,158,11,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  features: {
    gap: 12,
    marginTop: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextWrap: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  buyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  priceNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  restoreText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  laterText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
