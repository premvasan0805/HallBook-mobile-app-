import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Glass for Home's cards. The page backdrop is a pre-blurred photo, so a translucent tinted fill over it
 * reads as frosted glass on every platform without a live backdrop filter. Light comes from the top:
 * a bright top rim and inner highlight, a faint bottom highlight and a soft drop shadow.
 */
export function glassSurface(fill: string, radius: number, shadow = 'rgba(31, 58, 112, 0.07)'): ViewStyle {
  return {
    backgroundColor: fill,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    // Edge light: bright top rim, inner glow along every edge, and a soft white halo outside the pane.
    boxShadow: `inset 0px 2px 0px rgba(255, 255, 255, 1), inset 0px -1.5px 0px rgba(255, 255, 255, 0.7), inset 0px 0px 22px rgba(255, 255, 255, 0.8), 0px 0px 6px rgba(255, 255, 255, 0.95), 0px 0px 22px rgba(255, 255, 255, 0.85), 0px 10px 26px ${shadow}`,
  };
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
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={strength} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
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
  return (
    <View
      style={[
        {
          borderRadius: radius,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.85)',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0px 1px 0px rgba(255, 255, 255, 1), inset 0px 0px 10px rgba(255, 255, 255, 0.7), 0px 0px 10px rgba(255, 255, 255, 0.85), 0px 3px 8px rgba(31, 58, 112, 0.08)',
        },
        style,
      ]}>
      <GradientFill from={from} to={to} radius={radius} />
      <Sheen radius={radius} strength={0.6} height="50%" />
      {children}
    </View>
  );
}

/** Misty blue wash over a backdrop photo: clear at the top so the venue shows, deepening down the page so white glass glows against it. */
export function BlueWash() {
  const id = useSvgId('bw');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor="#C9DAF4" stopOpacity={0} />
            <Stop offset="0.2" stopColor="#C9DAF4" stopOpacity={0.3} />
            <Stop offset="0.55" stopColor="#B8CDEE" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#A9C1E8" stopOpacity={0.62} />
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
