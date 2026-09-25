import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Touchable } from '@/components/primitives';
import { appWidth, F } from '@/lib/theme';

const VENUE = require('../../assets/images/home/hero-venue.jpg');
/** Leaf sprig, lotus and the light swoosh behind the header, traced from the design. */
const DECOR = require('../../assets/images/home/hero-decor.png');
/** Mandala and sparkles printed on the right of the bookings card. */
const CARD_MANDALA = require('../../assets/images/home/hero-mandala.png');

/** The home header is laid out on a 1740×842 reference; `h(px)` converts a reference pixel to dp. */
const REF_WIDTH = 1740;
const REF_HEIGHT = 842;

/** Bookings card, in reference px relative to its own top-left (placed at CARD_X, CARD_Y). */
const CARD_X = 68;
const CARD_Y = 475;
const CARD_W = 1610;
const CARD_H = 327;
/** Where the top edge starts dropping, and where it lands 74px lower to uncover the photo. */
const DIP_FROM = 722;
const DIP_TO = 1172;
const DIP = 74;
const CARD_SHAPE =
  `M0 48Q0 0 48 0L${DIP_FROM} 0C812 0 932 39 1032 58C1092 70 1122 ${DIP} ${DIP_TO} ${DIP}` +
  `L1564 ${DIP}Q1610 ${DIP} 1610 120L1610 281Q1610 327 1564 327L48 327Q0 327 0 279Z`;
/** Room around the card path so its gold stroke is not clipped by the SVG viewport. */
const STROKE_PAD = 4;

/** True when a point (card-local reference px) is inside the card below its curved top edge. */
function inCard(x: number, y: number) {
  if (x < 0 || x > CARD_W || y > CARD_H) return false;
  if (x <= DIP_FROM) return y >= 0;
  if (x >= DIP_TO) return y >= DIP;
  const t = (x - DIP_FROM) / (DIP_TO - DIP_FROM);
  return y >= DIP * t * t * (3 - 2 * t);
}

/** Venue photo, 780×450 reference px at (PHOTO_X, PHOTO_Y); its top-left edge is a gold wave. */
const PHOTO_X = 960;
const PHOTO_Y = 157;
const PHOTO_W = 780;
const PHOTO_H = 450;
const PHOTO_EDGE = 'M0 350C120 345 200 215 270 154C370 90 460 20 600 17L780 9';
const PHOTO_SHAPE = `${PHOTO_EDGE}L780 ${PHOTO_H}L0 ${PHOTO_H}Z`;

const BURGUNDY = '#6E1128';
const GOLD_TEXT = '#F2D08E';
const GOLD_LINE = '#D9AE62';
const TAGLINE = '#9C7443';

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
      <Image source={DECOR} style={{ position: 'absolute', left: 0, top: 0, width: h(REF_WIDTH), height: h(REF_HEIGHT) }} />

      {/* Venue photo clipped to the wave, with a gold rim on the wave */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: h(PHOTO_X), top: h(PHOTO_Y), width: h(PHOTO_W), height: h(PHOTO_H) }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${PHOTO_W} ${PHOTO_H}`}>
          <Defs>
            <ClipPath id="heroPhotoClip">
              <Path d={PHOTO_SHAPE} />
            </ClipPath>
            <LinearGradient id="heroPhotoRim" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#E9CD8F" />
              <Stop offset="0.5" stopColor="#D2A55A" />
              <Stop offset="1" stopColor="#E6C27E" />
            </LinearGradient>
          </Defs>
          <SvgImage href={VENUE} width={PHOTO_W} height={PHOTO_H} preserveAspectRatio="none" clipPath="url(#heroPhotoClip)" />
          <Path d={PHOTO_EDGE} fill="none" stroke="rgba(255,248,232,0.8)" strokeWidth={11} />
          <Path d={PHOTO_EDGE} fill="none" stroke="url(#heroPhotoRim)" strokeWidth={5} />
        </Svg>
      </View>

      {/* Greeting, name and hall */}
      <Text style={[st.abs, { left: h(86), top: h(46), fontFamily: F.regular, fontSize: h(47), lineHeight: h(56), color: '#5E5E60' }]}>
        {greeting},
      </Text>
      <Text
        numberOfLines={1}
        style={[
          st.abs,
          { left: h(84), top: h(111), right: h(1000), fontFamily: F.serifBold, fontSize: h(127), lineHeight: h(132), color: BURGUNDY },
        ]}>
        {name}
      </Text>
      <Touchable
        onPress={onHall}
        accessibilityLabel="Hall details"
        style={[st.abs, st.row, { left: h(80), top: h(228), right: h(1000), height: h(80), gap: h(34) }]}>
        <MaterialCommunityIcons name="town-hall" size={h(62)} color={BURGUNDY} />
        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: F.regular, fontSize: h(43), lineHeight: h(52), color: '#15171C' }}>
          {hallName}
        </Text>
        <Ionicons name="chevron-forward" size={h(36)} color="#15171C" style={{ marginLeft: -h(8) }} />
      </Touchable>

      {/* Tagline */}
      <View pointerEvents="none" style={[st.abs, { left: h(888), top: h(134) }]}>
        <Text style={{ fontFamily: F.serif, fontSize: h(55), lineHeight: h(58), color: TAGLINE }}>
          Make Every{'\n'}Celebration{'\n'}Memorable
        </Text>
      </View>
      <View pointerEvents="none" style={[st.abs, { left: h(888), top: h(328) }]}>
        <DiamondRule width={h(190)} diamondAt={h(105)} color={GOLD_LINE} />
      </View>

      {/* Bell and avatar */}
      <Touchable
        onPress={onAlerts}
        accessibilityLabel="Notifications"
        style={[st.abs, st.center, { left: h(1350), top: h(37), width: h(100), height: h(100), zIndex: 3 }]}>
        <Ionicons name="notifications-outline" size={h(80)} color="#0A0B0F" />
        {hasAlerts ? (
          <View
            style={{
              position: 'absolute',
              left: h(60),
              top: h(13),
              width: h(25),
              height: h(25),
              borderRadius: h(13),
              backgroundColor: '#D7262E',
            }}
          />
        ) : null}
      </Touchable>
      <Touchable
        onPress={onProfile}
        accessibilityLabel="Profile"
        style={[
          st.abs,
          st.center,
          { left: h(1509), top: h(20), width: h(134), height: h(134), borderRadius: h(67), backgroundColor: '#F5DCE3', zIndex: 3 },
        ]}>
        <Text style={{ fontFamily: F.medium, fontSize: h(58), lineHeight: h(70), color: BURGUNDY }}>{initials}</Text>
      </Touchable>

      {/* Today's bookings card. Only the curved outline is tappable; its content ignores touches. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: h(CARD_X + 6),
          top: h(CARD_Y + DIP + 10),
          width: h(CARD_W - 12),
          height: h(CARD_H - DIP - 12),
          borderRadius: h(46),
          backgroundColor: '#5B0C1E',
          boxShadow: `0px ${h(18)}px ${h(30)}px rgba(90, 30, 20, 0.28)`,
        }}
      />
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
            style={{ position: 'absolute', left: -h(STROKE_PAD), top: -h(STROKE_PAD) }}
            width={h(CARD_W + STROKE_PAD * 2)}
            height={h(CARD_H + STROKE_PAD * 2)}
            viewBox={`${-STROKE_PAD} ${-STROKE_PAD} ${CARD_W + STROKE_PAD * 2} ${CARD_H + STROKE_PAD * 2}`}>
            <Defs>
              <LinearGradient id="heroCardFill" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#540B1C" />
                <Stop offset="0.45" stopColor="#6A0F23" />
                <Stop offset="1" stopColor="#7E182D" />
              </LinearGradient>
              <LinearGradient id="heroCardShade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#2A0008" stopOpacity={0} />
                <Stop offset="1" stopColor="#2A0008" stopOpacity={0.22} />
              </LinearGradient>
              <LinearGradient id="heroCardRim" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#F4D9A0" />
                <Stop offset="0.5" stopColor="#D6A95C" />
                <Stop offset="1" stopColor="#EBCB8C" />
              </LinearGradient>
            </Defs>
            <Path d={CARD_SHAPE} fill="url(#heroCardFill)" />
            <Path d={CARD_SHAPE} fill="url(#heroCardShade)" />
            <Path d={CARD_SHAPE} fill="none" stroke="url(#heroCardRim)" strokeWidth={4} />
          </Svg>

          <Image
            source={CARD_MANDALA}
            style={{ position: 'absolute', left: h(932), top: h(79), width: h(672), height: h(244) }}
          />

          {/* Calendar badge and title */}
          <View
            style={[
              st.abs,
              st.center,
              {
                left: h(65),
                top: h(32),
                width: h(101),
                height: h(100),
                borderRadius: h(24),
                borderWidth: h(2.5),
                borderColor: 'rgba(233, 199, 140, 0.45)',
                backgroundColor: 'rgba(255, 235, 220, 0.07)',
              },
            ]}>
            <MaterialCommunityIcons name="calendar-month-outline" size={h(74)} color={GOLD_TEXT} />
          </View>
          <Text style={[st.abs, { left: h(219), top: h(46), fontFamily: F.serifSemibold, fontSize: h(60), lineHeight: h(66), color: GOLD_TEXT }]}>
            Today&apos;s Bookings
          </Text>
          <View style={[st.abs, { left: h(665), top: h(71) }]}>
            <DiamondRule width={h(230)} diamondAt={h(179)} color={GOLD_LINE} leadDot />
          </View>

          {/* Count, divider, headline and next booking */}
          <Text
            style={[
              st.abs,
              { left: h(64), top: h(128), fontFamily: F.serifBold, fontSize: h(190), lineHeight: h(190), color: GOLD_TEXT, fontVariant: ['lining-nums'] },
            ]}>
            {count}
          </Text>
          <View style={[st.abs, { left: h(219), top: h(161), width: h(2.5), height: h(117) }]}>
            <Svg width="100%" height="100%" viewBox="0 0 2 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="heroDivider" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={GOLD_TEXT} stopOpacity={0.2} />
                  <Stop offset="0.5" stopColor={GOLD_TEXT} stopOpacity={1} />
                  <Stop offset="1" stopColor={GOLD_TEXT} stopOpacity={0.2} />
                </LinearGradient>
              </Defs>
              <Rect width={2} height={100} fill="url(#heroDivider)" />
            </Svg>
          </View>
          <Text
            numberOfLines={1}
            style={[st.abs, { left: h(280), top: h(146), width: h(860), fontFamily: F.semibold, fontSize: h(57), lineHeight: h(66), color: '#FFFFFF' }]}>
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[st.abs, { left: h(280), top: h(232), width: h(860), fontFamily: F.regular, fontSize: h(41), lineHeight: h(50), color: '#DDD2D5' }]}>
            {subtitle}
          </Text>

          {/* View pill */}
          <View
            style={[
              st.abs,
              st.row,
              {
                left: h(1225),
                top: h(157),
                width: h(334),
                height: h(118),
                borderRadius: h(59),
                borderWidth: h(4),
                borderColor: '#E6BE77',
                justifyContent: 'center',
                gap: h(44),
                overflow: 'hidden',
                boxShadow: `0px ${h(8)}px ${h(16)}px rgba(30, 0, 8, 0.35)`,
              },
            ]}>
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="heroViewFill" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FDF1D8" />
                  <Stop offset="0.55" stopColor="#F6DDB0" />
                  <Stop offset="1" stopColor="#E7C284" />
                </LinearGradient>
              </Defs>
              <Rect width={100} height={100} fill="url(#heroViewFill)" />
            </Svg>
            <Text style={{ fontFamily: F.semibold, fontSize: h(44), lineHeight: h(54), color: BURGUNDY }}>View</Text>
            <Ionicons name="arrow-forward" size={h(50)} color={BURGUNDY} />
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
