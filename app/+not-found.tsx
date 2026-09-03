import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { COLORS } from '@/utils/constants';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  useThemeStore((s) => s.themeId);
  const c = COLORS;
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>{t('notFound.title')}</Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: c.primary }]}>{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  link: { marginTop: 15, paddingVertical: 15 },
  linkText: { fontSize: 16 },
});
