import { describe, expect, it } from 'vitest';
import { resolveSwipeAction, clampSwipe, SWIPE_THRESHOLD, SWIPE_MAX } from '@/utils/swipe';

describe('resolveSwipeAction', () => {
  it('favorites on a right swipe past threshold', () => {
    expect(resolveSwipeAction(SWIPE_THRESHOLD)).toBe('favorite');
    expect(resolveSwipeAction(SWIPE_THRESHOLD + 40)).toBe('favorite');
  });

  it('deletes on a left swipe past threshold', () => {
    expect(resolveSwipeAction(-SWIPE_THRESHOLD)).toBe('delete');
    expect(resolveSwipeAction(-SWIPE_THRESHOLD - 40)).toBe('delete');
  });

  it('snaps back inside the dead zone', () => {
    expect(resolveSwipeAction(0)).toBeNull();
    expect(resolveSwipeAction(SWIPE_THRESHOLD - 1)).toBeNull();
    expect(resolveSwipeAction(-(SWIPE_THRESHOLD - 1))).toBeNull();
  });
});

describe('clampSwipe', () => {
  it('clamps travel to the max in both directions', () => {
    expect(clampSwipe(SWIPE_MAX + 50)).toBe(SWIPE_MAX);
    expect(clampSwipe(-SWIPE_MAX - 50)).toBe(-SWIPE_MAX);
    expect(clampSwipe(10)).toBe(10);
  });
});
