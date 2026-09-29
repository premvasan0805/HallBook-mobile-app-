import { useId } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G as SvgG, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Touchable } from '@/components/primitives';
import { F } from '@/lib/theme';

/**
 * Wide glass call-to-action bar: glossy blue (`blue`) or frosted white (`frost`), a bright white rim with halo,
 * soft light ribbons sweeping across both ends, an optional lotus line-drawing at the right end, and a
 * glass plus-orb or calendar glyph beside a serif label. Every measurement derives from `height`.
 */
export function GlassActionButton({
  title,
  onPress,
  variant = 'blue',
  icon = 'plus',
  lotus = variant === 'frost',
  height = 58,
  disabled,
  loading,
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'blue' | 'frost' | 'royal';
  icon?: 'plus' | 'calendar' | 'none';
  /** Lotus line-art tucked into the right end. */
  lotus?: boolean;
  height?: number;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  if (variant === 'royal') {
    return (
      <RoyalButton title={title} onPress={onPress} height={height} disabled={disabled} loading={loading} accessibilityLabel={accessibilityLabel} style={style} />
    );
  }
  const blue = variant === 'blue';
  const r = Math.round(height * 0.27);
  const ink = blue ? '#FFFFFF' : '#0E1B4F';
  const off = disabled || loading;

  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={[
        st.base,
        { height, borderRadius: r, gap: height * 0.26, paddingHorizontal: height * 0.4 },
        blue ? st.blue : st.frost,
        off && { opacity: 0.8 },
        style,
      ]}>
      <Body blue={blue} r={r} />
      <Ribbons blue={blue} r={r} />
      {lotus ? <Lotus blue={blue} height={height} /> : null}
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <>
          {icon === 'plus' ? <PlusOrb blue={blue} size={height * 0.7} /> : null}
          {icon === 'calendar' ? (
            // Wrapped so it stacks above the absolute fill layers on web.
            <View>
              <CalendarGlyph color={ink} size={height * 0.44} />
            </View>
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              fontFamily: F.pageSerifBold,
              fontSize: height * 0.36,
              lineHeight: height * 0.46,
              color: ink,
              letterSpacing: 0.1,
              textShadowColor: blue ? 'rgba(14, 40, 110, 0.35)' : 'transparent',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: blue ? 3 : 0,
            }}>
            {title}
          </Text>
        </>
      )}
    </Touchable>
  );
}

function useSvgId(prefix: string) {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

type StopSpec = [offset: string, color: string, opacity: number];
const BLUE_STOPS: StopSpec[] = [
  ['0', '#8DBBF6', 1],
  ['0.14', '#5E93EA', 1],
  ['0.42', '#3469D4', 1],
  ['0.62', '#2C5FCB', 1],
  ['0.86', '#4A80E0', 1],
  ['1', '#86B2F2', 1],
];
const FROST_STOPS: StopSpec[] = [
  ['0', '#FFFFFF', 0.78],
  ['0.5', '#F4F7FE', 0.62],
  ['1', '#E6EEFC', 0.72],
];

/** Fill: blue is bright at both ends and deep through the middle; frost is milky white with a cool tint. A top sheen and bottom glow sit over both. */
function Body({ blue, r }: { blue: boolean; r: number }) {
  const h = useSvgId('gab');
  const v = useSvgId('gav');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={h} x1="0" y1="0" x2="1" y2="0">
            {(blue ? BLUE_STOPS : FROST_STOPS).map(([offset, color, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
          <LinearGradient id={v} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={blue ? 0.3 : 0.7} />
            <Stop offset="0.42" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="0.8" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={blue ? 0.2 : 0.5} />
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill={`url(#${h})`} />
        <Rect width={100} height={100} fill={`url(#${v})`} />
      </Svg>
    </View>
  );
}

/** Translucent light ribbons: one falling from the upper left, one rising to the upper right. */
function Ribbons({ blue, r }: { blue: boolean; r: number }) {
  const band = blue ? '#FFFFFF' : '#9DB8EC';
  const line = blue ? '#FFFFFF' : '#86A6E4';
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
        {/* Left ribbon */}
        <Path d="M0 30C28 30 52 38 78 50S112 60 124 60H0Z" fill={band} fillOpacity={blue ? 0.1 : 0.12} />
        <Path d="M0 30C28 30 52 38 78 50S112 60 124 60" stroke={line} strokeOpacity={blue ? 0.45 : 0.4} strokeWidth={0.9} fill="none" />
        <Path d="M12 8C38 20 62 34 88 48S120 62 132 64" stroke={line} strokeOpacity={blue ? 0.22 : 0.2} strokeWidth={0.7} fill="none" />
        <Path d="M0 44C24 42 44 48 62 56" stroke={line} strokeOpacity={blue ? 0.3 : 0.25} strokeWidth={0.7} fill="none" />
        {/* Right ribbon */}
        <Path d="M232 60C278 58 318 42 346 20S384 0 400 0V60Z" fill={band} fillOpacity={blue ? 0.1 : 0.14} />
        <Path d="M232 60C278 58 318 42 346 20S384 0 400 0" stroke={line} strokeOpacity={blue ? 0.5 : 0.45} strokeWidth={0.9} fill="none" />
        <Path d="M262 60C300 56 330 44 354 30S388 14 404 12" stroke={line} strokeOpacity={blue ? 0.28 : 0.24} strokeWidth={0.7} fill="none" />
        <Path d="M300 60C330 54 356 46 376 36" stroke={line} strokeOpacity={blue ? 0.2 : 0.18} strokeWidth={0.7} fill="none" />
      </Svg>
    </View>
  );
}

/** Lotus line-art anchored to the bottom-right corner, with a spray of dots and fine stems. */
function Lotus({ blue, height }: { blue: boolean; height: number }) {
  const c = blue ? '#FFFFFF' : '#7F9FE0';
  const o = blue ? 0.42 : 0.5;
  const w = height * 1.35;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', right: height * 0.04, bottom: 0, width: w, height: height * 0.98 }}>
      <Svg width="100%" height="100%" viewBox="0 0 135 98">
        <SvgG stroke={c} strokeOpacity={o} strokeWidth={1.1} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Centre petal */}
          <Path d="M96 98C84 74 84 42 98 14C112 42 112 74 100 98" />
          <Path d="M98 30C92 52 92 74 98 96" strokeOpacity={o * 0.6} />
          {/* Left petal */}
          <Path d="M94 98C74 92 60 72 58 44C78 50 92 70 96 96" />
          {/* Right petal */}
          <Path d="M102 98C118 90 128 72 130 48C114 54 104 72 101 96" />
          {/* Outer left leaf */}
          <Path d="M92 98C70 98 50 90 40 72C62 72 80 82 92 96" />
          {/* Outer right leaf, clipped by the rim */}
          <Path d="M104 98C122 96 134 88 140 76" />
          {/* Stems */}
          <Path d="M88 97C72 92 58 86 46 84" strokeOpacity={o * 0.8} />
          <Path d="M84 96C74 86 66 78 54 72" strokeOpacity={o * 0.7} />
        </SvgG>
        <SvgG fill={c} fillOpacity={o + 0.1}>
          <Circle cx={46} cy={84} r={2.4} />
          <Circle cx={36} cy={62} r={2} />
          <Circle cx={54} cy={70} r={1.6} />
          <Circle cx={70} cy={22} r={2.2} />
          <Circle cx={80} cy={12} r={1.5} />
          <Circle cx={124} cy={18} r={2.2} />
          <Circle cx={116} cy={8} r={1.4} />
        </SvgG>
      </Svg>
    </View>
  );
}

/** Glass disc with a bright rim and a thick rounded plus. */
function PlusOrb({ blue, size }: { blue: boolean; size: number }) {
  const s = size * 0.46;
  const sw = size * 0.085;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: blue ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.55)',
        borderColor: blue ? 'rgba(255, 255, 255, 0.4)' : 'rgba(170, 196, 240, 0.9)',
        boxShadow: blue
          ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.45), inset 0px -4px 10px rgba(20, 60, 160, 0.25), 0px 2px 6px rgba(14, 40, 110, 0.2)'
          : 'inset 0px 1.5px 0px rgba(255, 255, 255, 1), inset 0px 0px 8px rgba(255, 255, 255, 0.9), 0px 0px 6px rgba(255, 255, 255, 0.9), 0px 2px 6px rgba(31, 58, 112, 0.1)',
      }}>
      <Svg width={s} height={s} viewBox="0 0 20 20">
        <Line x1={10} y1={1.5} x2={10} y2={18.5} stroke={blue ? '#FFFFFF' : '#1F55C8'} strokeWidth={(sw / s) * 20} strokeLinecap="round" />
        <Line x1={1.5} y1={10} x2={18.5} y2={10} stroke={blue ? '#FFFFFF' : '#1F55C8'} strokeWidth={(sw / s) * 20} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Outlined calendar: binder rings, header rule and a 3×2 grid of day squares. */
function CalendarGlyph({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2.5} y={4} width={19} height={17.5} rx={3} stroke={color} strokeWidth={1.8} fill="none" />
      <Line x1={2.5} y1={9} x2={21.5} y2={9} stroke={color} strokeWidth={1.8} />
      <Line x1={7.5} y1={2} x2={7.5} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={16.5} y1={2} x2={16.5} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {[7, 11, 15].map((x) =>
        [12.2, 16.2].map((y) => <Rect key={`${x}-${y}`} x={x} y={y} width={2.4} height={2.4} rx={0.4} fill={color} />),
      )}
    </Svg>
  );
}

// ---------- Royal: Home's Add Booking ----------

/** Pale glassy ends running into a medium blue under the label. */
const ROYAL_STOPS: StopSpec[] = [
  ['0', '#B4CFF8', 1],
  ['0.1', '#93B8F4', 1],
  ['0.26', '#6696EE', 1],
  ['0.42', '#4A7FE8', 1],
  ['0.56', '#4377E4', 1],
  ['0.72', '#5A8DEC', 1],
  ['0.9', '#90B6F4', 1],
  ['1', '#B4CFF8', 1],
];

/**
 * Blue glass capsule: pale glassy ends deepening to medium blue under the label, a thin bright white rim with
 * a soft pale halo, a faint inner bezel, two sweeping light waves (left one falling, right one rising) and a
 * clear glass bubble holding a thick white plus, beside a bold sans label.
 */
function RoyalButton({
  title,
  onPress,
  height,
  disabled,
  loading,
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress?: () => void;
  height: number;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const r = height * 0.38;
  const bezel = Math.max(3, height * 0.055);
  const off = disabled || loading;
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={[st.base, st.royal, { height, borderRadius: r, gap: height * 0.2, paddingHorizontal: height * 0.4 }, off && { opacity: 0.8 }, style]}>
      <RoyalBody r={r} />
      <RoyalWaves r={r} />
      {/* Faint inner bezel, strongest along the top and the left shoulder. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: bezel,
          left: bezel,
          right: bezel,
          bottom: bezel,
          borderRadius: r - bezel,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.16)',
          borderTopColor: 'rgba(255, 255, 255, 0.3)',
          borderLeftColor: 'rgba(255, 255, 255, 0.28)',
        }}
      />
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Bubble size={height * 0.56} />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: F.latoBold,
              fontSize: height * 0.36,
              lineHeight: height * 0.46,
              color: '#FFFFFF',
              letterSpacing: 0.2,
              textShadowColor: 'rgba(20, 50, 140, 0.35)',
              textShadowOffset: { width: 0, height: 1.5 },
              textShadowRadius: 3,
            }}>
            {title}
          </Text>
        </>
      )}
    </Touchable>
  );
}

/** Body gradient, a deeper glow behind the label and a white wash along the top and bottom rims. */
function RoyalBody({ r }: { r: number }) {
  const h = useSvgId('grb');
  const core = useSvgId('grc');
  const v = useSvgId('grv');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={h} x1="0" y1="0" x2="1" y2="0">
            {ROYAL_STOPS.map(([offset, color, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
          <RadialGradient id={core} cx="0.52" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#3A6FE0" stopOpacity={0.45} />
            <Stop offset="1" stopColor="#3A6FE0" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={v} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
            <Stop offset="0.18" stopColor="#FFFFFF" stopOpacity={0.1} />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="0.86" stopColor="#FFFFFF" stopOpacity={0.04} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.22} />
          </LinearGradient>
        </Defs>
        <Rect width={400} height={60} fill={`url(#${h})`} />
        <Ellipse cx={210} cy={30} rx={150} ry={34} fill={`url(#${core})`} />
        <Rect width={400} height={60} fill={`url(#${v})`} />
      </Svg>
    </View>
  );
}

/** Two light waves: one from the left rim dipping to the lower middle, one rising from the lower middle to the right rim. */
function RoyalWaves({ r }: { r: number }) {
  const band = useSvgId('grw');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={band} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.26} />
          </LinearGradient>
        </Defs>
        {/* Left wave: level from the rim, then falling to the bottom edge. */}
        <Path d="M0 28C30 26 60 28 88 36S140 58 186 60H0Z" fill={`url(#${band})`} />
        <Path d="M0 28C30 26 60 28 88 36S140 58 186 60" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={0.8} fill="none" />
        <Path d="M0 36C26 34 52 38 76 46S112 60 140 62" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={0.5} fill="none" />
        {/* Right wave: rising from the lower middle to the right rim. */}
        <Path d="M228 60C282 60 320 48 348 38S384 28 400 28V60Z" fill={`url(#${band})`} />
        <Path d="M228 60C282 60 320 48 348 38S384 28 400 28" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={0.8} fill="none" />
        <Path d="M262 62C306 58 336 50 360 44S390 38 402 38" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={0.5} fill="none" />
      </Svg>
    </View>
  );
}

/** Clear glass bubble: thin bright rim, lighter blue interior, a small specular arc and a thick white plus. */
function Bubble({ size }: { size: number }) {
  const fill = useSvgId('gbf');
  const s = size * 0.5;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(240, 248, 255, 0.85)',
        boxShadow:
          'inset 0px 0px 8px rgba(255, 255, 255, 0.4), 0px 0px 6px rgba(200, 225, 255, 0.45), 0px 2px 6px rgba(20, 50, 140, 0.18)',
      }}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={fill} cx="0.5" cy="0.55" r="0.55">
            <Stop offset="0" stopColor="#7FAEF4" stopOpacity={0.35} />
            <Stop offset="0.75" stopColor="#A9CBFA" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.45} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={49} fill={`url(#${fill})`} />
        {/* Specular arc along the upper-left inside of the rim */}
        <Path d="M18 38C22 24 34 14 48 11" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
      {/* Wrapped so the plus stacks above the absolute bubble fill on web. */}
      <View>
        <Svg width={s} height={s} viewBox="0 0 20 20">
          <SvgG stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round">
            <Line x1={10} y1={2} x2={10} y2={18} />
            <Line x1={2} y1={10} x2={18} y2={10} />
          </SvgG>
        </Svg>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  royal: {
    borderWidth: 2,
    borderColor: 'rgba(245, 250, 255, 0.95)',
    boxShadow:
      'inset 0px 1.5px 0px rgba(255, 255, 255, 0.7), inset 0px 0px 14px rgba(220, 236, 255, 0.45), 0px 0px 0px 1px rgba(255, 255, 255, 0.35), 0px 0px 10px rgba(225, 238, 255, 0.9), 0px 0px 28px rgba(140, 185, 250, 0.45), 0px 8px 20px rgba(40, 90, 200, 0.14)',
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  blue: {
    borderColor: 'rgba(236, 244, 255, 0.95)',
    boxShadow:
      'inset 0px 1.5px 0px rgba(255, 255, 255, 0.6), inset 0px 0px 14px rgba(190, 220, 255, 0.35), 0px 0px 0px 1px rgba(255, 255, 255, 0.5), 0px 0px 8px rgba(255, 255, 255, 0.85), 0px 0px 22px rgba(110, 160, 255, 0.45), 0px 8px 18px rgba(28, 72, 176, 0.22)',
  },
  frost: {
    borderColor: 'rgba(255, 255, 255, 0.98)',
    boxShadow:
      'inset 0px 2px 0px rgba(255, 255, 255, 1), inset 0px 0px 18px rgba(255, 255, 255, 0.85), 0px 0px 0px 1px rgba(200, 218, 250, 0.5), 0px 0px 8px rgba(255, 255, 255, 0.95), 0px 0px 22px rgba(255, 255, 255, 0.8), 0px 8px 18px rgba(31, 58, 112, 0.1)',
  },
});
