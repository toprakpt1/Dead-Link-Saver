import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useLinkStore } from '@/store/linkStore';
import { COLORS } from '@/utils/constants';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { UndoToast } from '@/components/UndoToast';
import { OfflineBanner } from '@/components/OfflineBanner';
import { hapticSave } from '@/utils/haptics';

export default function RootLayout() {
  const { addLink } = useLinkStore();

  useEffect(() => {
    // Handle incoming shared links
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

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [addLink]);

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <OnboardingTutorial />
      <UndoToast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
