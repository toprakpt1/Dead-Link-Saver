export const SWIPE_THRESHOLD = 72;
export const SWIPE_MAX = 96;

export type SwipeAction = 'favorite' | 'delete' | null;

// Maps a horizontal release offset to a card action. Right past threshold
// favorites, left past threshold deletes, anything short of it snaps back.
export function resolveSwipeAction(dx: number): SwipeAction {
  if (dx >= SWIPE_THRESHOLD) return 'favorite';
  if (dx <= -SWIPE_THRESHOLD) return 'delete';
  return null;
}

export function clampSwipe(dx: number): number {
  return Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx));
}
