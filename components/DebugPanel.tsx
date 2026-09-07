import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FlaskConical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { useLinkStore } from '@/store/linkStore';
import { performBackgroundScan, isBackgroundScanRegistered } from '@/services/backgroundScan';
import {
  notifyDeadLinks,
  getScheduledNotifications,
  getNotificationPermission,
  cancelAllScheduledNotifications,
} from '@/services/notifications';

// __DEV__-only: rendered from Settings behind a __DEV__ gate. Never ships to prod.
export function DebugPanel() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState({ perm: '…', bg: '…', scheduled: '…' });

  const refresh = useCallback(async () => {
    const perm = await getNotificationPermission();
    const bg = await isBackgroundScanRegistered();
    const scheduled = await getScheduledNotifications();
    setInfo({
      perm,
      bg: bg ? t('debug.yes') : t('debug.no'),
      scheduled: String(scheduled.length),
    });
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
      void refresh();
    }
  };

  const handleRunScan = () =>
    run('scan', async () => {
      const { checked, dead } = await performBackgroundScan();
      Alert.alert(t('debug.scanDoneTitle'), t('debug.scanDoneBody', { checked, dead }));
    });

  const handleTestDead = () =>
    run('dead', async () => {
      await notifyDeadLinks(t('notify.deadTitle'), t('notify.deadBody', { count: 3 }));
    });

  const handleTestSnooze = () =>
    run('snooze', async () => {
      const links = useLinkStore.getState().links;
      if (links.length === 0) {
        Alert.alert(t('debug.noLinksTitle'), t('debug.noLinksBody'));
        return;
      }
      await useLinkStore.getState().snoozeLink(links[0].id, Date.now() + 10_000);
      Alert.alert(t('debug.snoozeTestTitle'), t('debug.snoozeTestBody'));
    });

  const handleCancelAll = () =>
    run('cancel', async () => {
      const links = useLinkStore.getState().links;
      for (const link of links) {
        if (link.reminderId) {
          await useLinkStore.getState().clearReminder(link.id);
        }
      }
      await cancelAllScheduledNotifications();
    });

  const buttons: { key: string; label: string; onPress: () => void }[] = [
    { key: 'scan', label: t('debug.runScan'), onPress: handleRunScan },
    { key: 'dead', label: t('debug.testDead'), onPress: handleTestDead },
    { key: 'snooze', label: t('debug.testSnooze'), onPress: handleTestSnooze },
    { key: 'cancel', label: t('debug.cancelAll'), onPress: handleCancelAll },
  ];

  return (
    <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.sectionHeader}>
        <FlaskConical size={18} color={c.primary} />
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t('debug.title')}</Text>
      </View>
      <Text style={[styles.sectionSub, { color: c.textMuted }]}>{t('debug.desc')}</Text>
      <Text style={[styles.status, { color: c.textMuted }]}>
        {t('debug.perm')}: {info.perm} · {t('debug.bg')}: {info.bg} · {t('debug.scheduled')}: {info.scheduled}
      </Text>
      <View style={styles.buttons}>
        {buttons.map((b) => (
          <Pressable
            key={b.key}
            onPress={b.onPress}
            disabled={busy !== null}
            style={[styles.button, { backgroundColor: c.background, borderColor: c.border }]}
          >
            {busy === b.key ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <Text style={[styles.buttonText, { color: c.primary }]}>{b.label}</Text>
            )}
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => void refresh()} style={styles.refreshRow}>
        <Text style={[styles.refreshText, { color: c.textMuted }]}>{t('debug.refresh')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSub: { fontSize: 13, marginBottom: 8 },
  status: { fontSize: 12, marginBottom: 12 },
  buttons: { gap: 8 },
  button: { borderRadius: 8, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontSize: 14, fontWeight: '600' },
  refreshRow: { marginTop: 8, alignItems: 'center', paddingVertical: 6 },
  refreshText: { fontSize: 12 },
});
