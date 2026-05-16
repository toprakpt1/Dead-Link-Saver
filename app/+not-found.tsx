import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '@/utils/constants';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: COLORS.primary,
  },
});
