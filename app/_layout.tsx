import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import '@/utils/i18n';
import { MOTION } from '@/utils/motion';
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
import { extractUrls } from '@/services/linkParser';

export default function RootLayout() {
  const addLink = useLinkStore((s) => s.addLink);
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const loadTheme = useThemeStore((s) => s.loadTheme);
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
      const { queryParams } = Linking.parse(event.url);
      const sharedText = Object.values(queryParams ?? [])
        .filter((v): v is string => typeof v === 'string')
        .join('\n');
      const urls = extractUrls(sharedText || event.url);
      if (urls.length === 0) return;
      let saved = false;
      for (const raw of urls) {
        try {
          await addLink(raw);
          saved = true;
        } catch (error) {
          console.error('Failed to add shared link:', error);
        }
      }
      if (saved) hapticSave();
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

  // NOTE: bilinçli olarak `key` yok. Önceden `key={themeId-i18n.language}` vardı;
  // dil/tema değişiminde tüm Stack'i unmount edip navigator'ı patlatıyordu.
  // COLORS proxy anlık temayı okur, useTranslation() zaten dilde re-render eder.
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animationDuration: MOTION.stackPushMs,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        {/* "Card lift": detail rises from the bottom like a lifted card, with a
            slower settle. Content inside staggers in behind it
            (see RiseIn in app/link/[id].tsx). */}
        <Stack.Screen
          name="link/[id]"
          options={{
            animation: 'slide_from_bottom',
            animationDuration: MOTION.detailPresentMs,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen name="+not-found" options={{ animation: 'fade', animationDuration: 200 }} />
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
