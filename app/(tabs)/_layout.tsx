import { Tabs } from 'expo-router';
import { Bookmark, Clock, Sliders } from 'lucide-react-native';
import { COLORS } from '@/utils/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Saved Links',
          tabBarLabel: 'Links',
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forgotten"
        options={{
          title: 'Forgotten',
          tabBarLabel: 'Forgotten',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Sliders size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
