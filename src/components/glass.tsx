import { Image } from 'expo-image';
import { useId, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { GlassTier, Theme } from '@/lib/theme';
import { useTheme } from '@/lib/theme-context';

/** Web backdrop blur for a glass pane (`backdrop-filter`). Native has no live blur, so the pre-blurred venue
 * backdrop behind every screen does that job and this returns nothing. */
export function backdropBlur(px: number, saturate = 1.3): ViewStyle | null {
  if (Platform.OS !== 'web') return null;
  const f = `blur(${px}px) saturate(${saturate})`;
  return { backdropFilter: f, WebkitBackdropFilter: f } as unknown as ViewStyle;
}

/**
 * Frosted glass pane: a translucent fill over the blurred venue backdrop (live `backdrop-filter` on web), a thin
 * light rim, an inner top highlight and a soft ambient shadow — physical glass, not a gradient card.
 *
 * `fill` should come from the theme (`t.frost(a)`, `t.tint(a)`, `t.glassSurface` or `t.tiers[x].fill`). `shadow`
 * tints the drop shadow in light mode only; dark mode always uses the neutral theme shadow. `blur` adds a live
 * web backdrop blur — give it to top-level panes (`glassTier` does); controls nested inside glass skip it, since
 * stacked backdrop filters are costly on the GPU and blur what is already blurred.
 */
export function glassSurface(t: Theme, fill: string, radius: number, shadow?: string, blur = 0): ViewStyle {
  if (t.dark) {
    return {
      backgroundColor: fill,
      borderRadius: radius,
      borderWidth: 1,
      borderColor: t.glassBorder,
      boxShadow: `inset 0px 1px 0px rgba(255, 255, 255, 0.10), 0px 10px 30px ${t.shadow}`,
      ...(blur ? backdropBlur(blur, 1.2) : null),
    };
  }
  return {
    backgroundColor: fill,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: t.glassBorder,
    boxShadow: `inset 0px 1px 0px rgba(255, 255, 255, 0.45), inset 0px 0px 18px rgba(255, 255, 255, 0.10), 0px 8px 30px ${shadow ?? t.shadow}`,
    ...(blur ? backdropBlur(blur, 1.3) : null),
  };
}

/** Glass pane for a material tier: `primary` (major cards), `secondary` (small controls) or `strong` (sheets). */
export function glassTier(t: Theme, tier: GlassTier, radius: number): ViewStyle {
  const { fill, blur } = t.tiers[tier];
  const pane = glassSurface(t, fill, radius, undefined, blur);
  if (tier === 'strong') pane.borderColor = t.dark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.75)';
  return pane;
}

/** SVG ids must be unique per document on web; React ids contain characters `url(#…)` rejects. */
function useSvgId(prefix: string) {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

/** Vertical gradient fill clipped to the parent's corner radius. */
export function GradientFill({
  from,
  to,
  radius,
  horizontal,
  fromOpacity = 1,
  toOpacity = 1,
}: {
  from: string;
  to: string;
  radius: number;
  horizontal?: boolean;
  fromOpacity?: number;
  toOpacity?: number;
}) {
  const id = useSvgId('gf');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
            <Stop offset="0" stopColor={from} stopOpacity={fromOpacity} />
            <Stop offset="1" stopColor={to} stopOpacity={toOpacity} />
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Soft white sheen across the top of a glass surface. */
export function Sheen({ radius, strength = 0.5, height = '58%' }: { radius: number; strength?: number; height?: `${number}%` }) {
  const id = useSvgId('sh');
  const t = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        overflow: 'hidden',
      }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.highlight} stopOpacity={strength * t.sheen} />
            <Stop offset="1" stopColor={t.highlight} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Small glossy tile or pill: gradient body, white rim and a top sheen. */
export function GlossTile({
  from,
  to,
  radius,
  style,
  children,
}: {
  from: string;
  to: string;
  radius: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          borderWidth: 1,
          borderColor: t.glassBorder,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: t.dark
            ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.10), 0px 3px 8px rgba(0, 0, 0, 0.25)'
            : 'inset 0px 1px 0px rgba(255, 255, 255, 0.6), inset 0px 0px 8px rgba(255, 255, 255, 0.25), 0px 3px 8px rgba(30, 30, 30, 0.06)',
        },
        style,
      ]}>
      <GradientFill from={from} to={to} radius={radius} />
      <Sheen radius={radius} strength={0.6} height="50%" />
      {children}
    </View>
  );
}

/** Light: warm ivory veil — brighter behind the logo, lighter mid-page so the venue glows through, denser low down. */
const LIGHT_WASH = [
  ['0', '#FAF8F3', 0.52],
  ['0.3', '#FAF8F3', 0.34],
  ['0.7', '#F6F1E7', 0.36],
  ['1', '#F3EDE1', 0.46],
] as const;
/** Dark: near-black warm veil (#0E0D0B) that keeps the venue lights as faint depth. */
const DARK_WASH = [
  ['0', '#0E0D0B', 0.62],
  ['0.4', '#0E0D0B', 0.74],
  ['1', '#0E0D0B', 0.86],
] as const;

/**
 * Warm translucent overlay over the blurred venue photo: venue → blur → this wash → glass → content.
 * It softens contrast without hiding the environment.
 */
export function VenueWash() {
  const id = useSvgId('vw');
  const t = useTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.2" y2="1">
            {(t.dark ? DARK_WASH : LIGHT_WASH).map(([offset, color, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Softly blurred Banyan Meadows venue photo shared by every screen; glass surfaces sit translucent over it. */
export const GLASS_BACKDROP = require('../../assets/images/home/venue-backdrop.jpg');

/** Full-bleed page backdrop: blurred venue + warm wash. `Screen` uses it when no other backdrop is given. */
export function GlassBackdrop() {
  return (
    <>
      <Image source={GLASS_BACKDROP} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" />
      <VenueWash />
    </>
  );
}
