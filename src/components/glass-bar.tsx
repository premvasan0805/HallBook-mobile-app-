import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSyncExternalStore } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '@/lib/theme-context';

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
  const t = useTheme();
  const st = useSt();
  const { glass } = t;
  const shape = { borderRadius: radius };

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <GlassView glassEffectStyle="regular" colorScheme={t.scheme} style={[StyleSheet.absoluteFill, shape]} />;
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
        { backgroundColor: frosted ? glass.fill : reduce ? t.surface : glass.fillSolid },
        blur,
      ]}
    />
  );
}

const useSt = makeStyles(({ glass }) =>
  StyleSheet.create({
    rim: {
      borderWidth: 1,
      borderTopColor: glass.rimTop,
      borderLeftColor: glass.rim,
      borderRightColor: glass.rim,
      borderBottomColor: glass.rimBottom,
      boxShadow: glass.rimShadow,
    },
  }),
);
