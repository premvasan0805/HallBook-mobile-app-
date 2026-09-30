import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Calm ease-out for entrances: quick to start, long soft landing, no overshoot. */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
/** Symmetric ease for screen-to-screen fades. */
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

type Entrance = {
  delay?: number;
  duration?: number;
  /** Rise in px, from `y` below to rest. */
  y?: number;
  /** Starting scale, grows to 1. */
  scale?: number;
  /** Starting opacity. */
  from?: number;
  /** Where scaling pivots, e.g. the element's centre in px; defaults to the view's centre. */
  origin?: string;
  /** false renders at rest with no animation. */
  play?: boolean;
};

/**
 * One-shot entrance on the UI thread: fade, plus an optional small rise and grow.
 * With Reduce Motion on, only the fade remains.
 */
export function useEntrance({ delay = 0, duration = 500, y = 0, scale = 1, from = 0, origin, play = true }: Entrance) {
  const reduce = useReducedMotion();
  const t = useSharedValue(play ? 0 : 1);
  useEffect(() => {
    if (play) t.set(withDelay(delay, withTiming(1, { duration, easing: easeOut })));
    // Entrances run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => {
    const p = t.get();
    return {
      opacity: from + (1 - from) * p,
      transform: reduce ? [] : [{ translateY: (1 - p) * y }, { scale: scale + (1 - scale) * p }],
      ...(origin ? { transformOrigin: origin } : null),
    };
  });
}

/** Button press: 1 → 0.97 → 1 over ~170ms. Returns the style and a trigger. Reduce Motion skips it. */
export function usePressScale() {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  const press = () => {
    if (!reduce) s.set(withSequence(withTiming(0.97, { duration: 75, easing: easeInOut }), withTiming(1, { duration: 95, easing: easeInOut })));
  };
  return [style, press] as const;
}

/** Delay before acting on a press, so the press animation reads before the screen changes. */
export const PRESS_MS = 180;
