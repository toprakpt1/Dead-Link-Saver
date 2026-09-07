import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import i18n from '@/utils/i18n';
import { useLinkStore } from '@/store/linkStore';
import { useThemeStore } from '@/store/themeStore';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { UndoToast } from '@/components/UndoToast';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ClipboardPrompt } from '@/components/ClipboardPrompt';
import { hapticSave } from '@/utils/haptics';
import { useEntitlementStore } from '@/store/entitlementStore';
import { initAds, preloadRewarded } from '@/services/ads';
import { initPurchases } from '@/services/purchases';
import { initI18n } from '@/utils/i18n';
import { useRouter } from 'expo-router';
import { initNotifications, addNotificationResponseListener } from '@/services/notifications';
import { registerBackgroundScan } from '@/services/backgroundScan';
import { syncWidgetData } from '@/services/widgetSync';

export default function RootLayout() {
  const { addLink } = useLinkStore();
  const router = useRouter();
  const { theme, themeId, loadTheme } = useThemeStore();
  // i18n instance imported directly — useTranslation() can't run before initI18n()
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    void loadTheme();
    void initI18n().then(() => setI18nReady(true));
    void useEntitlementStore.getState().init();
    void initAds().then(() => void preloadRewarded());
    void initPurchases();
    void initNotifications().then((granted) => {
      if (granted) void registerBackgroundScan();
    });
  }, []);

  useEffect(() => {
    const handleUrl = async (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      if (queryParams?.url && typeof queryParams.url === 'string') {
        try {
          await addLink(queryParams.url);
          hapticSave();
        } catch (error) {
          console.error('Failed to add shared link:', error);
        }
      }
    };
    const subscription = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });
    return () => subscription.remove();
  }, [addLink]);

  useEffect(() => {
    const sub = addNotificationResponseListener((data) => {
      if (!data) return;
      if (data.type === 'snooze' && typeof data.linkId === 'string') {
        router.push(`/link/${data.linkId}`);
      } else if (data.type === 'dead') {
        router.push('/(tabs)');
      }
    });
    return () => sub.remove();
  }, [router]);

  // Mirror the latest links for the Android widget (native provider reads
  // the JSON file; sync skips writes when the list is unchanged).
  useEffect(() => {
    void syncWidgetData(useLinkStore.getState().links);
    return useLinkStore.subscribe((s) => {
      void syncWidgetData(s.links);
    });
  }, []);

  if (!i18nReady) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />;
  }

  // Re-render entire tree when theme or locale changes so legacy COLORS proxy users re-evaluate
  const treeKey = `${themeId}-${i18n.language}`;

  return (
    <View key={treeKey} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <OnboardingTutorial />
      <UndoToast />
      <ClipboardPrompt />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
