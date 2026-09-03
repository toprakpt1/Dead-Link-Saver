import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Gift, Crown, Clock, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/utils/constants';
import { useThemeStore } from '@/store/themeStore';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const rewardedRemaining = useEntitlementStore((s) => s.getRewardedRemaining());
  const isDark = useThemeStore((s) => s.theme.isDark);
  const c = COLORS;
  const title = type === 'check' ? t('rewarded.titleCheck') : t('rewarded.titleBackup');
  const desc = type === 'check' ? t('rewarded.descCheck') : t('rewarded.descBackup');

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
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={c.textMuted} />
          </Pressable>

          <View style={[styles.iconWrap, { backgroundColor: c.primaryMuted }]}>
            <Gift size={28} color={c.primary} />
          </View>

          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.desc, { color: c.textMuted }]}>{desc}</Text>

          <View style={styles.quotaRow}>
            <Clock size={14} color={c.textMuted} />
            <Text style={[styles.quotaText, { color: c.textMuted }]}>{t('rewarded.quota', { remaining: rewardedRemaining })}</Text>
          </View>

          <Pressable
            onPress={handleRewarded}
            disabled={loading || rewardedRemaining <= 0}
            style={[styles.primaryBtn, { backgroundColor: c.primary }, (loading || rewardedRemaining <= 0) && styles.btnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Gift size={18} color="#fff" />
                <Text style={styles.primaryText}>{rewardedRemaining <= 0 ? t('rewarded.limitReached') : t('rewarded.watch')}</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={onGoPro} style={[styles.proBtn, { borderColor: c.primary }]}>
            <Crown size={18} color={c.primary} />
            <Text style={[styles.proText, { color: c.primary }]}>{t('rewarded.goPro')}</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryText, { color: c.textMuted }]}>{type === 'check' ? t('rewarded.waitCheck') : t('rewarded.waitBackup')}</Text>
          </Pressable>

          <Text style={[styles.footnote, { color: c.textMuted }]}>{t('rewarded.footnote')}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 20, borderWidth: 1, gap: 12 },
  closeBtn: { position: 'absolute', top: 12, right: 12, padding: 6, zIndex: 1 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  quotaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  quotaText: { fontSize: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  proBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 12, borderRadius: 12 },
  proText: { fontWeight: '600', fontSize: 14 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { fontSize: 14 },
  footnote: { fontSize: 11, textAlign: 'center', opacity: 0.7 },
});
