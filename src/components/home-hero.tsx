import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Touchable } from '@/components/primitives';
import { appWidth, F } from '@/lib/theme';

/** Mandala and sparkles printed on the right of the bookings card. */
const CARD_MANDALA = require('../../assets/images/home/hero-mandala.png');

/** The home header is laid out on a 1740×964 reference; `h(px)` converts a reference pixel to dp. */
const REF_WIDTH = 1740;
const REF_HEIGHT = 964;

/** Bookings card, in reference px relative to its own top-left (placed at CARD_X, CARD_Y). */
const CARD_X = 68;
const CARD_Y = 544;
const CARD_W = 1610;
const CARD_H = 404;
/** Where the top edge starts dropping, and where it lands DIP px lower to uncover the backdrop photo. */
const DIP_FROM = 722;
const DIP_TO = 1172;
const DIP = 50;
const R = 58;
const CARD_SHAPE =
  `M0 ${R}Q0 0 ${R} 0L${DIP_FROM} 0C812 0 932 ${DIP * 0.53} 1032 ${DIP * 0.78}C1092 ${DIP * 0.95} 1122 ${DIP} ${DIP_TO} ${DIP}` +
  `L${CARD_W - R} ${DIP}Q${CARD_W} ${DIP} ${CARD_W} ${DIP + R}L${CARD_W} ${CARD_H - R}Q${CARD_W} ${CARD_H} ${CARD_W - R} ${CARD_H}` +
  `L${R} ${CARD_H}Q0 ${CARD_H} 0 ${CARD_H - R}Z`;
/** Room around the card path so its blurred glow is not clipped by the SVG viewport. */
const GLOW_PAD = 70;

/** Crest of the glass wave (header reference px): rises over the card's left half, dips into it, then climbs to the top-right. */
const WAVE =
  'M0 508C110 440 220 408 350 404C580 398 840 520 1060 588C1150 612 1230 610 1300 572C1460 490 1610 340 1740 256';
/** Sparkles on the wave crest: [x, y, radius] in header reference px. */
const SPARKS: [number, number, number][] = [
  [40, 486, 16],
  [350, 404, 9],
  [1650, 318, 13],
];
/** Light flares caught on the card rim: [cx, cy, rx, ry] in card-local reference px. */
const FLARES: [number, number, number, number][] = [
  [40, CARD_H - 8, 150, 30],
  [320, 0, 170, 14],
  [780, CARD_H, 230, 18],
  [1150, DIP - 1, 130, 12],
  [CARD_W, CARD_H - 90, 14, 70],
];

/** True when a point (card-local reference px) is inside the card below its curved top edge. */
function inCard(x: number, y: number) {
  if (x < 0 || x > CARD_W || y > CARD_H) return false;
  if (x <= DIP_FROM) return y >= 0;
  if (x >= DIP_TO) return y >= DIP;
  const t = (x - DIP_FROM) / (DIP_TO - DIP_FROM);
  return y >= DIP * t * t * (3 - 2 * t);
}

/** Home's blue glass palette. */
const INK = '#101A4C';
const NAME = '#0B1462';
const ROYAL = '#1D4FB4';
const ON_CARD = '#F5F7FC';
const RULE = 'rgba(255, 255, 255, 0.9)';

export function HomeHero({
  greeting,
  name,
  hallName,
  hasAlerts,
  count,
  title,
  subtitle,
  onOpen,
  onHall,
  onAlerts,
  onProfile,
  initials,
}: {
  greeting: string;
  name: string;
  hallName: string;
  hasAlerts: boolean;
  count: number;
  title: string;
  subtitle: string;
  onOpen: () => void;
  onHall: () => void;
  onAlerts: () => void;
  onProfile: () => void;
  initials: string;
}) {
  const { width } = useWindowDimensions();
  const h = (px: number) => (appWidth(width) / REF_WIDTH) * px;
  const [pressed, setPressed] = useState(false);
  const hit = (e: { nativeEvent: { locationX: number; locationY: number } }) =>
    inCard(e.nativeEvent.locationX / h(1), e.nativeEvent.locationY / h(1));

  return (
    <View style={{ height: h(REF_HEIGHT), zIndex: 1 }}>
      {/* Greeting, name and hall (the venue photo behind them is part of the page backdrop) */}
      <Text style={[st.abs, { left: h(122), top: h(70), fontFamily: F.regular, fontSize: h(43), lineHeight: h(52), color: '#4B5163' }]}>
        {greeting},
      </Text>
      <Text
        numberOfLines={1}
        style={[
          st.abs,
          { left: h(108), top: h(112), right: h(560), fontFamily: F.pageSerifBold, fontSize: h(128), lineHeight: h(150), color: NAME, letterSpacing: -h(1) },
        ]}>
        {name}
      </Text>
      <Touchable
        onPress={onHall}
        accessibilityLabel="Hall details"
        style={[st.abs, st.row, { left: h(108), top: h(280), right: h(880), height: h(88), gap: h(30) }]}>
        <View
          style={[
            st.center,
            {
              width: h(84),
              height: h(84),
              borderRadius: h(18),
              backgroundColor: 'rgba(220, 231, 250, 0.92)',
              boxShadow: `inset 0px ${h(2)}px 0px rgba(255,255,255,0.9), 0px ${h(4)}px ${h(10)}px rgba(31, 58, 112, 0.1)`,
            },
          ]}>
          <MaterialCommunityIcons name="town-hall" size={h(54)} color={ROYAL} />
        </View>
        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: F.medium, fontSize: h(46), lineHeight: h(56), color: INK }}>
          {hallName}
        </Text>
        <Ionicons name="chevron-forward" size={h(40)} color={INK} style={{ marginLeft: h(8) }} />
      </Touchable>

      {/* Bell and avatar, split by a hairline */}
      <Touchable
        onPress={onAlerts}
        accessibilityLabel="Notifications"
        style={[
          st.abs,
          st.center,
          {
            left: h(1316),
            top: h(41),
            width: h(132),
            height: h(132),
            borderRadius: h(66),
            backgroundColor: 'rgba(244, 247, 253, 0.82)',
            borderWidth: h(2),
            borderColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: `inset 0px ${h(2)}px 0px rgba(255,255,255,1), 0px ${h(8)}px ${h(22)}px rgba(31, 58, 112, 0.16)`,
            zIndex: 3,
          },
        ]}>
        <Ionicons name="notifications-outline" size={h(70)} color={NAME} />
        {hasAlerts ? (
          <View
            style={{
              position: 'absolute',
              left: h(74),
              top: h(22),
              width: h(22),
              height: h(22),
              borderRadius: h(11),
              backgroundColor: '#E8212B',
              borderWidth: h(2),
              borderColor: 'rgba(255,255,255,0.95)',
            }}
          />
        ) : null}
      </Touchable>
      <View
        pointerEvents="none"
        style={[st.abs, { left: h(1487), top: h(60), width: h(2), height: h(96), backgroundColor: 'rgba(110, 122, 155, 0.35)' }]}
      />
      <Touchable
        onPress={onProfile}
        accessibilityLabel="Profile"
        style={[
          st.abs,
          st.center,
          {
            left: h(1527),
            top: h(41),
            width: h(132),
            height: h(132),
            borderRadius: h(66),
            backgroundColor: 'rgba(232, 240, 253, 0.92)',
            borderWidth: h(3),
            borderColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: `inset 0px ${h(2)}px 0px rgba(255,255,255,1), 0px ${h(8)}px ${h(22)}px rgba(31, 58, 112, 0.16)`,
            zIndex: 3,
          },
        ]}>
        <Text style={{ fontFamily: F.regular, fontSize: h(64), lineHeight: h(76), color: ROYAL }}>{initials}</Text>
      </Touchable>

      {/* Glass wave sweeping across the photo behind the card, with a glowing crest */}
      <Svg
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0 }}
        width={h(REF_WIDTH)}
        height={h(REF_HEIGHT)}
        viewBox={`0 0 ${REF_WIDTH} ${REF_HEIGHT}`}>
        <Defs>
          <Filter id="waveGlow" x="-10%" y="-60%" width="120%" height="220%">
            <FeGaussianBlur stdDeviation={9} />
          </Filter>
          <Filter id="sparkBlur" x="-200%" y="-200%" width="500%" height="500%">
            <FeGaussianBlur stdDeviation={6} />
          </Filter>
          <LinearGradient id="waveBody" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
            <Stop offset="0.5" stopColor="#E3EDFC" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#D6E4FA" stopOpacity={0.1} />
          </LinearGradient>
          <LinearGradient id="waveCrest" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
            <Stop offset="0.25" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="0.6" stopColor="#F2F7FF" stopOpacity={0.85} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Path d={`${WAVE}L${REF_WIDTH} ${REF_HEIGHT}L0 ${REF_HEIGHT}Z`} fill="url(#waveBody)" />
        <Path d={WAVE} fill="none" stroke="#C9DCFB" strokeWidth={26} strokeOpacity={0.9} filter="url(#waveGlow)" />
        <Path d={WAVE} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeOpacity={0.95} filter="url(#waveGlow)" />
        <Path d={WAVE} fill="none" stroke="url(#waveCrest)" strokeWidth={3.5} />
        {SPARKS.map(([x, y, r]) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#FFFFFF" filter="url(#sparkBlur)" />
        ))}
        {SPARKS.map(([x, y, r]) => (
          <Circle key={`c-${x}-${y}`} cx={x} cy={y} r={r * 0.3} fill="#FFFFFF" />
        ))}
      </Svg>

      {/* Today's bookings card. Only the curved outline is tappable; its content ignores touches. */}
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Today's bookings: ${count}. ${title}. ${subtitle}`}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={onOpen}
        onStartShouldSetResponder={hit}
        onResponderGrant={() => setPressed(true)}
        onResponderTerminate={() => setPressed(false)}
        onResponderRelease={(e) => {
          setPressed(false);
          if (hit(e)) onOpen();
        }}
        style={[
          st.abs,
          { left: h(CARD_X), top: h(CARD_Y), width: h(CARD_W), height: h(CARD_H) },
          pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        ]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg
            style={{ position: 'absolute', left: -h(GLOW_PAD), top: -h(GLOW_PAD) }}
            width={h(CARD_W + GLOW_PAD * 2)}
            height={h(CARD_H + GLOW_PAD * 2)}
            viewBox={`${-GLOW_PAD} ${-GLOW_PAD} ${CARD_W + GLOW_PAD * 2} ${CARD_H + GLOW_PAD * 2}`}>
            <Defs>
              <Filter id="cardBloom" x="-10%" y="-40%" width="120%" height="180%">
                <FeGaussianBlur stdDeviation={16} />
              </Filter>
              <Filter id="cardHalo" x="-10%" y="-40%" width="120%" height="180%">
                <FeGaussianBlur stdDeviation={7} />
              </Filter>
              <Filter id="cardInner" x="-10%" y="-40%" width="120%" height="180%">
                <FeGaussianBlur stdDeviation={10} />
              </Filter>
              <ClipPath id="cardClip">
                <Path d={CARD_SHAPE} />
              </ClipPath>
              {/* Royal-blue glass: saturated on the left, clearing to misty blue on the right where the photo shows through */}
              <LinearGradient id="heroCardFill" x1="0" y1="0.4" x2="1" y2="0.6">
                <Stop offset="0" stopColor="#2257C4" stopOpacity={0.96} />
                <Stop offset="0.3" stopColor="#3469D0" stopOpacity={0.9} />
                <Stop offset="0.62" stopColor="#6E97DE" stopOpacity={0.72} />
                <Stop offset="1" stopColor="#CBDBF4" stopOpacity={0.55} />
              </LinearGradient>
              <LinearGradient id="heroCardSheen" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
                <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.04} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </LinearGradient>
              <RadialGradient id="flare" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="0.35" stopColor="#EAF2FF" stopOpacity={0.6} />
                <Stop offset="1" stopColor="#EAF2FF" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="floorGlow" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
                <Stop offset="0" stopColor="#DCE9FF" stopOpacity={0.55} />
                <Stop offset="1" stopColor="#DCE9FF" stopOpacity={0} />
              </RadialGradient>
            </Defs>

            {/* Outer bloom: a blue-white halo that reads against the pale photo */}
            <Path d={CARD_SHAPE} fill="none" stroke="#B7D0FA" strokeWidth={44} strokeOpacity={0.85} filter="url(#cardBloom)" />
            <Path d={CARD_SHAPE} fill="none" stroke="#FFFFFF" strokeWidth={18} filter="url(#cardHalo)" />

            {/* Glass body */}
            <Path d={CARD_SHAPE} fill="url(#heroCardFill)" />
            <Path d={CARD_SHAPE} fill="url(#heroCardSheen)" />
            <G clipPath="url(#cardClip)">
              <Ellipse cx={CARD_W * 0.42} cy={CARD_H + 20} rx={CARD_W * 0.55} ry={90} fill="url(#floorGlow)" />
              {/* Inner glow hugging the rim */}
              <Path d={CARD_SHAPE} fill="none" stroke="#FFFFFF" strokeWidth={30} strokeOpacity={0.75} filter="url(#cardInner)" />
            </G>

            {/* Crisp glass rim */}
            <Path d={CARD_SHAPE} fill="none" stroke="#FFFFFF" strokeWidth={5} />
            <Path d={CARD_SHAPE} fill="none" stroke="#DCE9FF" strokeWidth={1.5} strokeOpacity={0.9} />

            {/* Light flares caught on the rim */}
            {FLARES.map(([x, y, rx, ry]) => (
              <Ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill="url(#flare)" />
            ))}
          </Svg>

          <Image
            source={CARD_MANDALA}
            tintColor="#FFFFFF"
            style={{ position: 'absolute', left: h(900), top: h(150), width: h(672), height: h(244), opacity: 0.45 }}
          />

          {/* Calendar badge and title */}
          <View
            style={[
              st.abs,
              st.center,
              {
                left: h(56),
                top: h(48),
                width: h(138),
                height: h(138),
                borderRadius: h(32),
                borderWidth: h(3),
                borderColor: 'rgba(225, 238, 255, 1)',
                overflow: 'hidden',
                boxShadow: `inset 0px ${h(3)}px 0px rgba(255,255,255,0.55), inset 0px 0px ${h(18)}px rgba(255,255,255,0.35), 0px 0px ${h(8)}px ${h(2)}px rgba(255,255,255,0.95), 0px 0px ${h(60)}px ${h(10)}px rgba(150, 200, 255, 0.95)`,
              },
            ]}>
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="heroTileFill" x1="0" y1="0" x2="0.4" y2="1">
                  <Stop offset="0" stopColor="#5A93EC" />
                  <Stop offset="1" stopColor="#2A62CC" />
                </LinearGradient>
              </Defs>
              <Rect width={100} height={100} fill="url(#heroTileFill)" />
            </Svg>
            <MaterialCommunityIcons name="calendar-month-outline" size={h(80)} color="#FFFFFF" />
          </View>
          <Text
            style={[
              st.abs,
              {
                left: h(256),
                top: h(54),
                fontFamily: F.serifBold,
                fontSize: h(74),
                lineHeight: h(84),
                color: ON_CARD,
                textShadowColor: 'rgba(10, 30, 90, 0.35)',
                textShadowOffset: { width: 0, height: h(2) },
                textShadowRadius: h(6),
              },
            ]}>
            Today&apos;s Bookings
          </Text>
          <View style={[st.abs, { left: h(790), top: h(89) }]}>
            <DiamondRule width={h(190)} diamondAt={h(180)} color={RULE} />
          </View>

          {/* Count, divider, headline and next booking */}
          <Text
            style={[
              st.abs,
              {
                left: h(56),
                top: h(196),
                width: h(138),
                textAlign: 'center',
                fontFamily: F.serifBold,
                fontSize: h(170),
                lineHeight: h(176),
                color: '#FFFFFF',
                fontVariant: ['lining-nums'],
                textShadowColor: 'rgba(225, 238, 255, 1)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: h(26),
              },
            ]}>
            {count}
          </Text>
          <View style={[st.abs, { left: h(250), top: h(196), width: h(2.5), height: h(150) }]}>
            <Svg width="100%" height="100%" viewBox="0 0 2 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="heroDivider" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.15} />
                  <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.75} />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.15} />
                </LinearGradient>
              </Defs>
              <Rect width={2} height={100} fill="url(#heroDivider)" />
            </Svg>
          </View>
          <Text
            numberOfLines={1}
            style={[st.abs, { left: h(296), top: h(196), width: h(900), fontFamily: F.bold, fontSize: h(64), lineHeight: h(76), color: '#FFFFFF' }]}>
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[st.abs, { left: h(296), top: h(290), width: h(900), fontFamily: F.regular, fontSize: h(41), lineHeight: h(50), color: '#E6EEFB' }]}>
            {subtitle}
          </Text>

          {/* View pill */}
          <View
            style={[
              st.abs,
              st.row,
              {
                left: h(1212),
                top: h(215),
                width: h(351),
                height: h(123),
                borderRadius: h(62),
                borderWidth: h(4),
                borderColor: 'rgba(214, 234, 255, 1)',
                justifyContent: 'center',
                gap: h(56),
                overflow: 'hidden',
                boxShadow: `inset 0px ${h(3)}px 0px rgba(255, 255, 255, 0.45), inset 0px 0px ${h(16)}px rgba(170, 210, 255, 0.55), 0px 0px ${h(10)}px ${h(3)}px rgba(235, 245, 255, 0.95), 0px 0px ${h(64)}px ${h(12)}px rgba(150, 200, 255, 0.95), 0px ${h(10)}px ${h(24)}px rgba(10, 28, 70, 0.2)`,
              },
            ]}>
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="heroViewFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#3F7DE2" />
                  <Stop offset="0.55" stopColor="#2B63CE" />
                  <Stop offset="1" stopColor="#1C4DB4" />
                </LinearGradient>
              </Defs>
              <Rect width={100} height={100} fill="url(#heroViewFill)" />
            </Svg>
            <Text style={{ fontFamily: F.semibold, fontSize: h(48), lineHeight: h(58), color: '#FFFFFF' }}>View</Text>
            <Ionicons name="arrow-forward" size={h(50)} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Thin gold rule with an outlined diamond, optionally starting from a small dot. */
function DiamondRule({ width, diamondAt, color, leadDot }: { width: number; diamondAt: number; color: string; leadDot?: boolean }) {
  const s = width / 100;
  const d = diamondAt / s;
  return (
    <Svg width={width} height={width * 0.12} viewBox="0 0 100 12">
      <Defs>
        <LinearGradient id={leadDot ? 'ruleTail' : 'tagTail'} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0.9} />
          <Stop offset="1" stopColor={color} stopOpacity={0.15} />
        </LinearGradient>
      </Defs>
      {leadDot ? <Path d="M1 6L2.2 4.8L3.4 6L2.2 7.2Z" fill={color} /> : null}
      <Path d={`M${leadDot ? 2.2 : 0} 6H${d - 7}`} stroke={color} strokeWidth={0.7} />
      <Path d={`M${d} 1L${d + 5} 6L${d} 11L${d - 5} 6Z`} fill={color} />
      <Path d={`M${d + 7} 6H100`} stroke={`url(#${leadDot ? 'ruleTail' : 'tagTail'})`} strokeWidth={0.7} />
    </Svg>
  );
}

const st = StyleSheet.create({
  abs: { position: 'absolute' },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
