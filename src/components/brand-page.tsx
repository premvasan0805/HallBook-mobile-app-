import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useId, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Text as SvgText, TSpan } from 'react-native-svg';

import { BrandGradient, Mandala } from '@/components/decor';
import { goBack, Touchable } from '@/components/primitives';
import { useStore, type SegmentKey, type SlotKey } from '@/lib/store';
import { appWidth, C, elevation, F } from '@/lib/theme';

export type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const GOLD = '#D2A566';

const FLORAL = require('../../assets/images/customer/floral-bottom.png');

/** Each booking timing gets its own soft sky tone so the four read apart at a glance. */
export const SLOT_META: Record<SlotKey, { icon: MciName; fg: string; bg: string }> = {
  full: { icon: 'white-balance-sunny', fg: '#D98A1C', bg: '#FDF1DC' },
  first: { icon: 'weather-sunset-up', fg: '#C2334F', bg: '#FCE8EC' },
  second: { icon: 'moon-waning-crescent', fg: '#6A45B0', bg: '#EEE8F7' },
  early: { icon: 'weather-sunset', fg: '#2F7F9A', bg: '#E1F1F6' },
};

/** Day segments reuse the same sky tones as the timings they make up. */
export const SEGMENT_META: Record<SegmentKey, { icon: MciName; fg: string; bg: string }> = {
  early: { icon: 'weather-sunset-up', fg: '#D98A1C', bg: '#FDF1DC' },
  late: { icon: 'white-balance-sunny', fg: '#D98A1C', bg: '#FDF1DC' },
  evening: { icon: 'moon-waning-crescent', fg: '#6A45B0', bg: '#EEE8F7' },
};

/** Reference artboard the page header is laid out against; `u()` maps its units to dp. */
const PH_W = 2096;
const PH_H = 395;
const PH_BORDER = 13;
/** Mandala + mandap artwork cut from the reference, pinned to the right edge. */
const PH_ART = require('../../assets/images/header/page-header-art.png');
const PH_ART_TOP = require('../../assets/images/header/page-header-top.png');
const PH_ART_W = 1073;
const PH_BG = '#600B20';
const PH_IVORY = '#FBF8F7';

/**
 * Burgundy page header for form-style screens: back button, two-tone serif title
 * (`title` in white, `accent` in gold), hall switcher, and a gold mandala + mandap artwork.
 * Also sets a light status bar while the screen is focused.
 */
export function BrandPageHeader({ title, accent }: { title: string; accent: string }) {
  const insets = useSafeAreaInsets();
  const { hall } = useStore();
  const { width } = useWindowDimensions();
  const id = `bph-${useId().replace(/:/g, '')}`;
  const [focused, setFocused] = useState(false);
  const k = appWidth(width) / PH_W;
  const u = (n: number) => n * k;
  const hallSize = Math.max(u(60), 12);
  const corners = { borderBottomLeftRadius: u(100), borderBottomRightRadius: u(100) };

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  return (
    <View style={[st.headerShadow, corners]}>
      <View
        style={[st.header, corners, { height: insets.top + u(PH_H + PH_BORDER), borderBottomWidth: u(PH_BORDER) }]}>
        {focused ? <StatusBar style="light" /> : null}
        {insets.top > 0 ? (
          // The artwork's top row, stretched up through the status bar so its glow runs unbroken.
          <Image
            source={PH_ART_TOP}
            contentFit="fill"
            pointerEvents="none"
            style={{ position: 'absolute', right: 0, top: 0, width: u(PH_ART_W), height: insets.top + 1 }}
          />
        ) : null}

        <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top, height: u(PH_H) }}>
          <Image
            source={PH_ART}
            contentFit="fill"
            pointerEvents="none"
            style={{ position: 'absolute', right: 0, top: 0, width: u(PH_ART_W), height: u(PH_H) }}
          />

          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id={`${id}-gold`} x1="0" y1={u(112)} x2="0" y2={u(242)} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FFE9BE" />
                <Stop offset="0.45" stopColor="#F6D197" />
                <Stop offset="1" stopColor="#E9B26A" />
              </LinearGradient>
            </Defs>
            <SvgText
              x={u(318)}
              y={u(210)}
              fontFamily={F.pageSerifBold}
              fontSize={u(140)}
              letterSpacing={u(-2.9)}
              fill={PH_IVORY}>
              {title}
              <TSpan fill={`url(#${id}-gold)`}>{` ${accent}`}</TSpan>
            </SvgText>
          </Svg>

          <Touchable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={[st.back, { left: u(55), top: u(99), width: u(191), height: u(191), borderRadius: u(95.5) }]}>
            <Svg width={u(191)} height={u(191)} viewBox="0 0 191 191">
              <Path
                d="M59 95.5H134.5M95.5 63L59 95.5L95.5 130.5"
                stroke="#F1E2D9"
                strokeWidth={6.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Touchable>

          <Touchable
            onPress={() => router.push('/settings/hall')}
            accessibilityLabel="Hall details"
            style={[st.hallRow, { left: u(311), top: u(239), maxWidth: u(1080) }]}>
            <HallIcon id={id} size={u(90)} />
            <Text
              style={[
                st.hallName,
                { marginLeft: u(33), marginTop: u(306 - 239) - hallSize * 0.8765, fontSize: hallSize, lineHeight: hallSize },
              ]}
              numberOfLines={1}>
              {hall.name}
            </Text>
            <Svg width={u(52)} height={u(33)} viewBox="0 0 52 33" style={{ marginLeft: u(31), marginTop: u(31) }}>
              <Path
                d="M4 4L26 27L48 4"
                stroke={PH_IVORY}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Touchable>
        </View>
      </View>
    </View>
  );
}

/** Gold temple-front glyph shown beside the hall name. */
function HallIcon({ id, size }: { id: string; size: number }) {
  return (
    <Svg width={size} height={size * (86 / 90)} viewBox="0 0 90 86">
      <Defs>
        <LinearGradient id={`${id}-icon`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBD79A" />
          <Stop offset="1" stopColor="#E7AC62" />
        </LinearGradient>
      </Defs>
      <Path
        fill={`url(#${id}-icon)`}
        fillRule="evenodd"
        d="M45 6L84.5 25.5V27.5H5.5V25.5ZM45 15.5A4.4 4.4 0 1 0 45 24.3A4.4 4.4 0 1 0 45 15.5ZM10 31.5H80V36.5H10ZM13.5 38.5H22V40.5H20.5V64H22V66H13.5V64H15V40.5H13.5ZM31.5 38.5H40V40.5H38.5V64H40V66H31.5V64H33V40.5H31.5ZM50 38.5H58.5V40.5H57V64H58.5V66H50V64H51.5V40.5H50ZM68 38.5H76.5V40.5H75V64H76.5V66H68V64H69.5V40.5H68ZM10 67.5H80V71H10ZM5.5 73.5H84.5V79.5H5.5Z"
      />
    </Svg>
  );
}

/** Faint gold floral peeking in from the lower-left corner of a brand page. */
export function BrandFloral({ bottom = 0 }: { bottom?: number }) {
  return <Image source={FLORAL} style={[st.floral, { bottom }]} contentFit="contain" pointerEvents="none" />;
}

/** Thin gold line that fades out to the right — sits after a section label. */
export function GoldRule({ maxWidth = 110 }: { maxWidth?: number }) {
  const id = `gr-${useId().replace(/:/g, '')}`;
  return (
    <Svg height={2} style={{ flex: 1, maxWidth }}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={GOLD} stopOpacity={0.95} />
          <Stop offset="1" stopColor={GOLD} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="1.2" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Burgundy gradient button with faint mandalas at both ends and a gold icon. */
export function BrandButton({
  title,
  icon,
  onPress,
  disabled,
  style,
}: {
  title: string;
  icon: MciName;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const id = `cta-${useId().replace(/:/g, '')}`;
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[st.cta, style]}>
      <BrandGradient id={id} from={C.gradientTo} to={C.primaryDark} />
      <View style={st.ctaArtLeft} pointerEvents="none">
        <Mandala size={90} color={C.accentOnPrimary} opacity={0.18} />
      </View>
      <View style={st.ctaArtRight} pointerEvents="none">
        <Mandala size={90} color={C.accentOnPrimary} opacity={0.18} />
      </View>
      <MaterialCommunityIcons name={icon} size={20} color={C.accentOnPrimary} />
      <Text style={st.ctaText}>{title}</Text>
    </Touchable>
  );
}

/** Big burgundy call-to-action pinned to the bottom of a brand page. */
export function BrandCta(props: { title: string; icon: MciName; onPress: () => void; disabled?: boolean }) {
  return (
    <SafeAreaView edges={['bottom']} style={st.footer}>
      <BrandButton {...props} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  headerShadow: { backgroundColor: PH_BG, boxShadow: '0px 6px 16px rgba(110, 50, 20, 0.16)' },
  header: { overflow: 'hidden', backgroundColor: PH_BG, borderColor: '#F7C97C' },
  back: {
    position: 'absolute',
    backgroundColor: 'rgba(255,236,236,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hallRow: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-start' },
  hallName: { fontFamily: F.pageSerif, color: PH_IVORY, flexShrink: 1 },
  floral: { position: 'absolute', left: 0, width: 167, height: 137, opacity: 0.6 },
  footer: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, backgroundColor: C.bg },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.primary,
    ...elevation,
  },
  ctaArtLeft: { position: 'absolute', left: -30, top: -20 },
  ctaArtRight: { position: 'absolute', right: -30, top: -20 },
  ctaText: { fontFamily: F.serifBold, fontSize: 21, color: C.onPrimary },
});
