import { useId } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G as SvgG, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { backdropBlur } from '@/components/glass';
import { Touchable } from '@/components/primitives';
import { F, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/**
 * Wide glass call-to-action bar: soft muted-blue glass (`blue`) or frosted (`frost`), a thin light rim,
 * faint light ribbons sweeping across both ends, an optional lotus line-drawing at the right end, and a
 * glass plus-orb or calendar glyph beside a label. Every measurement derives from `height`.
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
  const t = useTheme();
  const st = useSt();
  if (variant === 'royal') {
    return (
      <RoyalButton title={title} onPress={onPress} height={height} disabled={disabled} loading={loading} accessibilityLabel={accessibilityLabel} style={style} />
    );
  }
  const blue = variant === 'blue';
  const r = Math.round(height * 0.27);
  const ink = blue ? t.G.onBlue : t.G.ink;
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
              fontFamily: F.semibold,
              fontSize: height * 0.28,
              lineHeight: height * 0.38,
              color: ink,
              letterSpacing: 0.1,
              textShadowColor: blue ? (t.dark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(30, 30, 30, 0.18)') : 'transparent',
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

/** Highlight multiplier: light trails and sheens stay faint, fainter still in dark mode. */
const glint = (t: Theme) => (t.dark ? 0.5 : 0.8);

type StopSpec = [offset: string, color: string, opacity: number];
/** Gold glass: slightly lighter at both ends, settling into the deeper tone through the middle. */
const blueStops = (t: Theme): StopSpec[] => [
  ['0', t.G.gradFrom, 0.84],
  ['0.42', t.G.gradTo, 0.76],
  ['0.62', t.G.gradTo, 0.76],
  ['1', t.G.gradFrom, 0.84],
];
const frostStops = (t: Theme): StopSpec[] =>
  t.dark
    ? [
        ['0', t.highlight, 0.09],
        ['0.5', t.highlight, 0.06],
        ['1', t.C.primary, 0.08],
      ]
    : [
        ['0', t.highlight, 0.78],
        ['0.5', t.background, 0.62],
        ['1', t.C.primarySoft, 0.72],
      ];

/** Fill: blue is lighter at both ends and deeper through the middle; frost is milky with a cool tint. A faint top wash sits over both. */
function Body({ blue, r }: { blue: boolean; r: number }) {
  const t = useTheme();
  const h = useSvgId('gab');
  const v = useSvgId('gav');
  const k = glint(t);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={h} x1="0" y1="0" x2="1" y2="0">
            {(blue ? blueStops(t) : frostStops(t)).map(([offset, color, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
          <LinearGradient id={v} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.highlight} stopOpacity={(blue ? 0.18 : 0.5) * k} />
            <Stop offset="0.42" stopColor={t.highlight} stopOpacity={0} />
            <Stop offset="0.8" stopColor={t.highlight} stopOpacity={0} />
            <Stop offset="1" stopColor={t.highlight} stopOpacity={(blue ? 0.06 : 0.2) * k} />
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
  const t = useTheme();
  const k = glint(t);
  const band = blue ? t.highlight : t.C.primaryMuted;
  const line = blue ? t.highlight : t.secondary;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
        {/* Left ribbon */}
        <Path d="M0 30C28 30 52 38 78 50S112 60 124 60H0Z" fill={band} fillOpacity={(blue ? 0.08 : 0.12) * k} />
        <Path d="M0 30C28 30 52 38 78 50S112 60 124 60" stroke={line} strokeOpacity={(blue ? 0.32 : 0.4) * k} strokeWidth={0.9} fill="none" />
        <Path d="M12 8C38 20 62 34 88 48S120 62 132 64" stroke={line} strokeOpacity={(blue ? 0.16 : 0.2) * k} strokeWidth={0.7} fill="none" />
        <Path d="M0 44C24 42 44 48 62 56" stroke={line} strokeOpacity={(blue ? 0.22 : 0.25) * k} strokeWidth={0.7} fill="none" />
        {/* Right ribbon */}
        <Path d="M232 60C278 58 318 42 346 20S384 0 400 0V60Z" fill={band} fillOpacity={(blue ? 0.08 : 0.14) * k} />
        <Path d="M232 60C278 58 318 42 346 20S384 0 400 0" stroke={line} strokeOpacity={(blue ? 0.36 : 0.45) * k} strokeWidth={0.9} fill="none" />
        <Path d="M262 60C300 56 330 44 354 30S388 14 404 12" stroke={line} strokeOpacity={(blue ? 0.2 : 0.24) * k} strokeWidth={0.7} fill="none" />
        <Path d="M300 60C330 54 356 46 376 36" stroke={line} strokeOpacity={(blue ? 0.14 : 0.18) * k} strokeWidth={0.7} fill="none" />
      </Svg>
    </View>
  );
}

/** Lotus line-art anchored to the bottom-right corner, with a spray of dots and fine stems. */
function Lotus({ blue, height }: { blue: boolean; height: number }) {
  const t = useTheme();
  const c = blue ? t.highlight : t.secondary;
  const o = (blue ? 0.42 : 0.5) * (t.dark ? 0.6 : 0.9);
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

/** Subtle glass disc with a thin rim and a thick rounded plus. */
function PlusOrb({ blue, size }: { blue: boolean; size: number }) {
  const t = useTheme();
  const s = size * 0.46;
  const sw = size * 0.085;
  const plus = blue ? t.G.onBlue : t.G.blue;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: blue ? (t.dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.12)') : t.frost(0.55),
        borderColor: blue ? t.G.buttonBorder : t.lightBlue,
        boxShadow: t.dark
          ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 2px 6px ${t.shadow}`
          : blue
            ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.3), 0px 1px 4px rgba(30, 30, 30, 0.1)'
            : `inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 2px 6px ${t.shadow}`,
      }}>
      <Svg width={s} height={s} viewBox="0 0 20 20">
        <Line x1={10} y1={1.5} x2={10} y2={18.5} stroke={plus} strokeWidth={(sw / s) * 20} strokeLinecap="round" />
        <Line x1={1.5} y1={10} x2={18.5} y2={10} stroke={plus} strokeWidth={(sw / s) * 20} strokeLinecap="round" />
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

/** Gold light caught in glass: brighter translucent gold at the top-left fading to a clearer pane (135°). */
const royalStops = (t: Theme): StopSpec[] => [
  ['0', '#D6AA45', t.dark ? 0.5 : 0.62],
  ['0.55', '#C69224', t.dark ? 0.36 : 0.46],
  ['1', '#C69224', t.dark ? 0.26 : 0.34],
];

/**
 * Gold-lit glass capsule (Home's Add Booking): translucent gold over a live backdrop blur, a thin light rim,
 * a faint inner bezel, two sweeping light waves (left one falling, right one rising) and a subtle glass
 * bubble holding a thick plus, beside a bold sans label.
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
  const t = useTheme();
  const st = useSt();
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
          borderColor: t.dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.1)',
          borderTopColor: t.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)',
          borderLeftColor: t.dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.18)',
        }}
      />
      {loading ? (
        <ActivityIndicator color={t.G.onBlue} />
      ) : (
        <>
          <Bubble size={height * 0.56} />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: F.semibold,
              fontSize: height * 0.28,
              lineHeight: height * 0.38,
              color: t.G.onBlue,
              letterSpacing: 0.1,
              textShadowColor: t.dark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(110, 72, 8, 0.35)',
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

/** Body gradient, a slightly deeper tone behind the label and a faint light wash along the top and bottom rims. */
function RoyalBody({ r }: { r: number }) {
  const t = useTheme();
  const h = useSvgId('grb');
  const v = useSvgId('grv');
  const k = t.dark ? 0.35 : 0.6;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={h} x1="0" y1="0" x2="1" y2="1">
            {royalStops(t).map(([offset, color, opacity]) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
          <LinearGradient id={v} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.highlight} stopOpacity={0.42 * k} />
            <Stop offset="0.18" stopColor={t.highlight} stopOpacity={0.1 * k} />
            <Stop offset="0.5" stopColor={t.highlight} stopOpacity={0} />
            <Stop offset="0.86" stopColor={t.highlight} stopOpacity={0.02 * k} />
            <Stop offset="1" stopColor={t.highlight} stopOpacity={0.1 * k} />
          </LinearGradient>
        </Defs>
        <Rect width={400} height={60} fill={`url(#${h})`} />
        <Rect width={400} height={60} fill={`url(#${v})`} />
      </Svg>
    </View>
  );
}

/** Two light waves: one from the left rim dipping to the lower middle, one rising from the lower middle to the right rim. */
function RoyalWaves({ r }: { r: number }) {
  const t = useTheme();
  const band = useSvgId('grw');
  const k = glint(t);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={band} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.highlight} stopOpacity={0.1 * k} />
            <Stop offset="1" stopColor={t.highlight} stopOpacity={0.18 * k} />
          </LinearGradient>
        </Defs>
        {/* Left wave: level from the rim, then falling to the bottom edge. */}
        <Path d="M0 28C30 26 60 28 88 36S140 58 186 60H0Z" fill={`url(#${band})`} />
        <Path d="M0 28C30 26 60 28 88 36S140 58 186 60" stroke={t.highlight} strokeOpacity={0.4 * k} strokeWidth={0.8} fill="none" />
        <Path d="M0 36C26 34 52 38 76 46S112 60 140 62" stroke={t.highlight} strokeOpacity={0.14 * k} strokeWidth={0.5} fill="none" />
        {/* Right wave: rising from the lower middle to the right rim. */}
        <Path d="M228 60C282 60 320 48 348 38S384 28 400 28V60Z" fill={`url(#${band})`} />
        <Path d="M228 60C282 60 320 48 348 38S384 28 400 28" stroke={t.highlight} strokeOpacity={0.4 * k} strokeWidth={0.8} fill="none" />
        <Path d="M262 62C306 58 336 50 360 44S390 38 402 38" stroke={t.highlight} strokeOpacity={0.14 * k} strokeWidth={0.5} fill="none" />
      </Svg>
    </View>
  );
}

/** Subtle glass bubble: thin light rim, faintly lighter interior, a small soft arc and a thick plus. */
function Bubble({ size }: { size: number }) {
  const t = useTheme();
  const fill = useSvgId('gbf');
  const s = size * 0.5;
  const k = glint(t);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: t.G.buttonBorder,
        boxShadow: t.dark
          ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.25)'
          : 'inset 0px 1px 0px rgba(255, 255, 255, 0.3), 0px 1px 4px rgba(30, 30, 30, 0.1)',
      }}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={fill} cx="0.5" cy="0.55" r="0.55">
            <Stop offset="0" stopColor={t.highlight} stopOpacity={0.06 * k} />
            <Stop offset="0.75" stopColor={t.highlight} stopOpacity={0.1 * k} />
            <Stop offset="1" stopColor={t.highlight} stopOpacity={0.2 * k} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={49} fill={`url(#${fill})`} />
        {/* Soft arc along the upper-left inside of the rim */}
        <Path d="M18 38C22 24 34 14 48 11" stroke={t.highlight} strokeOpacity={0.4 * k} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
      {/* Wrapped so the plus stacks above the absolute bubble fill on web. */}
      <View>
        <Svg width={s} height={s} viewBox="0 0 20 20">
          <SvgG stroke={t.G.onBlue} strokeWidth={3.6} strokeLinecap="round">
            <Line x1={10} y1={2} x2={10} y2={18} />
            <Line x1={2} y1={10} x2={18} y2={10} />
          </SvgG>
        </Svg>
      </View>
    </View>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    royal: {
      borderWidth: 1,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.65)',
      backgroundColor: t.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)',
      boxShadow: t.dark
        ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.18), 0px 8px 24px rgba(0, 0, 0, 0.45)'
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.6), 0px 8px 24px rgba(198, 146, 36, 0.20)',
      ...backdropBlur(25),
    },
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    blue: {
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
      ...backdropBlur(22),
    },
    frost: {
      ...backdropBlur(24),
      borderColor: t.glassBorder,
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 8px 20px ${t.shadow}`
        : `inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 6px 16px ${t.shadow}`,
    },
  }),
);
