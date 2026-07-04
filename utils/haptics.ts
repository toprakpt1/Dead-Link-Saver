import * as Haptics from 'expo-haptics';

export function hapticSave() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticDelete() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function hapticFavorite() {
  Haptics.selectionAsync();
}

export function hapticUndo() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
