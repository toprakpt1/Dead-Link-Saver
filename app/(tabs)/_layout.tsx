import { Tabs } from 'expo-router';
import { Bookmark, Clock, Sliders, ChartColumn } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const c = theme.colors;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.savedLinks'),
          tabBarLabel: t('tabs.links'),
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tabs.statsTitle'),
          tabBarLabel: t('tabs.stats'),
          tabBarIcon: ({ color, size }) => <ChartColumn size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forgotten"
        options={{
          title: t('tabs.forgottenLinks'),
          tabBarLabel: t('tabs.forgotten'),
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settingsTitle'),
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => <Sliders size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
