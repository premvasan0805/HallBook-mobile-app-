import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSyncExternalStore } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { C, glass } from '@/lib/theme';

const reduceQuery = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-transparency: reduce)')
    : null;

function subscribeReduce(onChange: () => void) {
  const mq = reduceQuery();
  mq?.addEventListener?.('change', onChange);
  return () => mq?.removeEventListener?.('change', onChange);
}

/** Web only: follows the OS "reduce transparency" preference. Native glass handles it itself. */
function useReduceTransparency() {
  return useSyncExternalStore(
    subscribeReduce,
    () => reduceQuery()?.matches ?? false,
    () => false,
  );
}

/**
 * Background for the floating tab bar.
 * iOS 26+: native Liquid Glass. Web: frosted backdrop blur with a top-lit rim.
 * Android and reduced transparency: near-solid fill with the same rim, since there is nothing to blur.
 */
export function GlassBarBackground({ radius }: { radius: number }) {
  const reduce = useReduceTransparency();
  const shape = { borderRadius: radius };

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <GlassView glassEffectStyle="regular" colorScheme="light" style={[StyleSheet.absoluteFill, shape]} />;
  }

  const frosted = Platform.OS === 'web' && !reduce;
  const blur = frosted
    ? ({ backdropFilter: glass.backdrop, WebkitBackdropFilter: glass.backdrop } as unknown as ViewStyle)
    : null;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        shape,
        st.rim,
        { backgroundColor: frosted ? glass.fill : reduce ? C.surface : glass.fillSolid },
        blur,
      ]}
    />
  );
}

const st = StyleSheet.create({
  rim: {
    borderWidth: 1.5,
    borderTopColor: glass.rimTop,
    borderLeftColor: glass.rim,
    borderRightColor: glass.rim,
    borderBottomColor: glass.rimBottom,
    boxShadow: 'inset 0px 1.5px 0px rgba(255, 255, 255, 1), inset 0px 0px 20px rgba(255, 255, 255, 0.75), 0px 0px 6px rgba(255, 255, 255, 0.95), 0px 0px 24px rgba(255, 255, 255, 0.9), 0px 10px 28px rgba(31, 58, 112, 0.12)',
  },
});
