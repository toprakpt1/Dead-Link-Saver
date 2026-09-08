import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Page transitions stay platform-native: the Stack uses built-in animations
// per route (fade for tabs root, slide_from_bottom for link detail), tabs
// crossfade with the OS preset. Only durations are tuned here, and everything
// collapses to no-animation when the OS requests reduced motion.
export const MOTION = {
  stackPushMs: 280,
  detailPresentMs: 380,
} as const;

export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduced(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('change', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
