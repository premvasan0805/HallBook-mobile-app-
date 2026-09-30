import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Fine-line lotus used as a faint decorative accent. Never carries meaning. */
export function Lotus({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  return (
    <Svg width={size} height={size * 0.74} viewBox="0 0 100 74" opacity={opacity}>
      <Path
        d="M50 6C61 21 61 42 50 60C39 42 39 21 50 6Z M50 60C37 52 27 37 29 18C40 25 48 40 50 60Z M50 60C63 52 73 37 71 18C60 25 52 40 50 60Z M50 62C33 60 17 50 8 33C23 33 40 43 50 62Z M50 62C67 60 83 50 92 33C77 33 60 43 50 62Z M20 67Q50 76 80 67"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const MANDALA_RINGS = [
  { count: 16, d: 'M100 100C93 82 93 64 100 46C107 64 107 82 100 100Z' },
  { count: 16, d: 'M100 46C90 34 90 20 100 8C110 20 110 34 100 46Z', offset: 11.25 },
  { count: 32, d: 'M100 8Q103 4 100 0Q97 4 100 8Z' },
];

/** Fine-line mandala (lotus rosette) used as a faint decorative accent on blue surfaces. */
export function Mandala({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" opacity={opacity}>
      {MANDALA_RINGS.map((ring, r) => (
        <G key={r}>
          {Array.from({ length: ring.count }, (_, i) => (
            <Path
              key={i}
              d={ring.d}
              transform={`rotate(${(360 / ring.count) * i + (ring.offset ?? 0)} 100 100)`}
              fill="none"
              stroke={color}
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
          ))}
        </G>
      ))}
      <Circle cx={100} cy={100} r={14} fill="none" stroke={color} strokeWidth={1.1} />
      <Circle cx={100} cy={100} r={56} fill="none" stroke={color} strokeWidth={0.8} />
      <Circle cx={100} cy={100} r={5} fill={color} />
    </Svg>
  );
}

/** Thin gold rule with two interlocked hearts in the middle — a title flourish. */
export function HeartRule({ width, color }: { width: number; color: string }) {
  return (
    <Svg width={width} height={width * 0.125} viewBox="0 0 240 30">
      <Line x1={4} y1={15} x2={96} y2={15} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={144} y1={15} x2={236} y2={15} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Path
        d="M113 26C99 18 99 6 106 5C110 4 113 7 113 10C113 7 116 4 120 5C127 6 127 18 113 26Z"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d="M127 26C113 18 113 6 120 5C124 4 127 7 127 10C127 7 130 4 134 5C141 6 141 18 127 26Z"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M96 15L100 12L104 15L100 18Z M136 15L140 12L144 15L140 18Z" fill={color} />
    </Svg>
  );
}

/**
 * Subtle left-to-right gradient sheen filling its parent (parent needs `overflow: 'hidden'`).
 * Pass `shape` (an SVG path in `viewBox` units) to fill a custom outline instead of the whole rect.
 */
export function BrandGradient({
  from,
  to,
  id,
  shape,
  viewBox = '0 0 100 100',
}: {
  from: string;
  to: string;
  id: string;
  shape?: string;
  viewBox?: string;
}) {
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox={viewBox}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0.4">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      {shape ? (
        <Path d={shape} fill={`url(#${id})`} />
      ) : (
        <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
      )}
    </Svg>
  );
}

/** Gold line-art wedding mandapam (domed pavilion) used as a faint illustration on brand panels. */
export function Mandapam({ width, color, opacity = 1 }: { width: number; color: string; opacity?: number }) {
  return (
    <Svg width={width} height={width * 0.7} viewBox="0 0 160 112" opacity={opacity}>
      <G fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
        {/* steps and platform */}
        <Path d="M6 110H154M14 104H146V110M22 96H138V104" />
        {/* pillars */}
        <Path d="M32 52V96M38 52V96M56 52V96M62 52V96M98 52V96M104 52V96M122 52V96M128 52V96" />
        {/* beam */}
        <Path d="M24 46H136V52H24Z" />
        {/* central arch and garland */}
        <Path d="M62 96V70Q80 54 98 70V96" />
        <Path d="M62 58Q70 66 80 58Q90 66 98 58" />
        {/* domes */}
        <Path d="M54 46Q54 18 80 10Q106 18 106 46" />
        <Path d="M64 46Q64 28 80 22Q96 28 96 46" />
        <Path d="M26 46Q26 32 35 28Q44 32 44 46M116 46Q116 32 125 28Q134 32 134 46" />
        {/* kalasam finials */}
        <Path d="M80 10V3M35 28V23M125 28V23" />
        {/* side lamps */}
        <Path d="M10 96V78M8 78H12M150 96V78M148 78H152M10 74Q12 70 10 66Q8 70 10 74M150 74Q152 70 150 66Q148 70 150 74" />
      </G>
      <Circle cx={80} cy={3} r={2} fill={color} />
      <Circle cx={35} cy={22} r={1.6} fill={color} />
      <Circle cx={125} cy={22} r={1.6} fill={color} />
    </Svg>
  );
}

const RULE_FLOWER = Array.from({ length: 8 }, (_, i) => i * 45);
const RULE_BUD =
  'M0 8C-5 4-5-3 0-8C5-3 5 4 0 8ZM0 8C-3 4-9 2-11-3C-6-3-2 1 0 8ZM0 8C3 4 9 2 11-3C6-3 2 1 0 8Z';

/**
 * Thin gold rule that fades out at both ends, with a small lotus ornament on it — a section-title flourish.
 * `kind` picks an open eight-petal flower or a lotus bud; `at` places it along the line (0–1).
 */
export function OrnamentRule({
  width,
  color,
  kind = 'flower',
  at = 0.5,
}: {
  width: number;
  color: string;
  kind?: 'flower' | 'bud';
  at?: number;
}) {
  const id = `rule-${useId().replace(/:/g, '')}`;
  const cx = width * at;
  const gap = kind === 'flower' ? 17 : 14;
  return (
    <Svg width={width} height={28} viewBox={`0 0 ${width} 28`}>
      <Defs>
        {/* User-space units: a zero-height line has no bounding box for the default units. */}
        <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={14} x2={width} y2={14}>
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.25" stopColor={color} stopOpacity={0.9} />
          <Stop offset="0.75" stopColor={color} stopOpacity={0.9} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={`M0 14H${cx - gap}M${cx + gap} 14H${width}`} stroke={`url(#${id})`} strokeWidth={1.2} />
      <G transform={`translate(${cx} 14)`} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round">
        {kind === 'flower' ? (
          <>
            {RULE_FLOWER.map((a) => (
              <Path key={a} d="M0-3C3-5 3-9 0-12C-3-9-3-5 0-3Z" transform={`rotate(${a})`} />
            ))}
            <Circle r={2.6} />
          </>
        ) : (
          <Path d={RULE_BUD} />
        )}
      </G>
    </Svg>
  );
}
