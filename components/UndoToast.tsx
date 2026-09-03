import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLinkStore } from '@/store/linkStore';
import { useThemeStore } from '@/store/themeStore';
import { COLORS } from '@/utils/constants';
import { hapticUndo } from '@/utils/haptics';

export function UndoToast() {
  const { t } = useTranslation();
  const deletedLink = useLinkStore((s) => s.deletedLink);
  const undoDelete = useLinkStore((s) => s.undoDelete);
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useThemeStore((s) => s.themeId);
  const c = COLORS;

  useEffect(() => {
    if (deletedLink) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 80, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [deletedLink]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border, transform: [{ translateY }], opacity }]}>
      <Text style={[styles.text, { color: c.text }]} numberOfLines={1}>
        {t('undoToast.deletedPrefix')} {deletedLink?.metadata.title ?? t('undoToast.link')}
      </Text>
      <TouchableOpacity onPress={() => { hapticUndo(); undoDelete(); }} style={styles.undoButton}>
        <Text style={[styles.undoText, { color: c.primary }]}>{t('undoToast.undo')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 12,
    right: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  text: { flex: 1, fontSize: 14 },
  undoButton: { paddingVertical: 4, paddingHorizontal: 8 },
  undoText: { fontSize: 14, fontWeight: '600' },
});
