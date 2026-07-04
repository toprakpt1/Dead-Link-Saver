import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLinkStore } from '@/store/linkStore';
import { COLORS } from '@/utils/constants';
import { hapticUndo } from '@/utils/haptics';

export function UndoToast() {
  const deletedLink = useLinkStore((s) => s.deletedLink);
  const undoDelete = useLinkStore((s) => s.undoDelete);
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <Text style={styles.text} numberOfLines={1}>
        Deleted: {deletedLink?.metadata.title ?? 'link'}
      </Text>
      <TouchableOpacity onPress={() => { hapticUndo(); undoDelete(); }} style={styles.undoButton}>
        <Text style={styles.undoText}>Undo</Text>
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
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  undoButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
