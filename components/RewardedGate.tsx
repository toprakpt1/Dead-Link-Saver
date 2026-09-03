import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Gift, Crown, Clock, X } from 'lucide-react-native';
import { COLORS } from '@/utils/constants';
import { showRewarded, preloadRewarded } from '@/services/ads';
import { useEntitlementStore } from '@/store/entitlementStore';

type GateType = 'check' | 'backup';

interface RewardedGateProps {
  visible: boolean;
  type: GateType;
  onClose: () => void;
  onRewarded: () => void;
  onGoPro: () => void;
}

export function RewardedGate({ visible, type, onClose, onRewarded, onGoPro }: RewardedGateProps) {
  const [loading, setLoading] = useState(false);
  const rewardedRemaining = useEntitlementStore((s) => s.getRewardedRemaining());
  const title = type === 'check' ? 'Günlük tarama hakkın doldu' : 'Haftalık yedek hakkın doldu';
  const desc =
    type === 'check'
      ? 'İstersen ödüllü reklam izleyip hemen 1 ek tarama açabilirsin, ya da Pro ile sınırsız tara.'
      : 'İstersen reklam izleyip 1 ek yedek alabilir, ya da Pro ile sınırsız yedekleyebilirsin.';

  const handleRewarded = async () => {
    if (rewardedRemaining <= 0) return;
    setLoading(true);
    try {
      await preloadRewarded();
      const success = await showRewarded();
      if (success) {
        await useEntitlementStore.getState().grantRewardedBonus(type);
        onRewarded();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={COLORS.textMuted} />
          </Pressable>

          <View style={styles.iconWrap}>
            <Gift size={28} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{desc}</Text>

          <View style={styles.quotaRow}>
            <Clock size={14} color={COLORS.textMuted} />
            <Text style={styles.quotaText}>Bugün kalan ödüllü hak: {rewardedRemaining}/3</Text>
          </View>

          <Pressable
            onPress={handleRewarded}
            disabled={loading || rewardedRemaining <= 0}
            style={[styles.primaryBtn, (loading || rewardedRemaining <= 0) && styles.btnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Gift size={18} color="#fff" />
                <Text style={styles.primaryText}>
                  {rewardedRemaining <= 0 ? 'Günlük limit doldu' : 'Reklam izle +1 hak kazan'}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={onGoPro} style={styles.proBtn}>
            <Crown size={18} color={COLORS.primary} />
            <Text style={styles.proText}>Pro al — sınırsız & reklamsız</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>{type === 'check' ? 'Yarın tekrar dene' : 'Vazgeç'}</Text>
          </Pressable>

          <Text style={styles.footnote}>Reklam yüklenemezse hak otomatik verilir — seni bekletmeyiz.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(108,142,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  quotaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  proBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  proText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  footnote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    opacity: 0.7,
  },
});
