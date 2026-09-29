import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useId, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop } from '@/components/glass-header';
import { useToast } from '@/components/overlays';
import { goBack, ScrollFade, Touchable, useSmoothScroll } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { appWidth, F } from '@/lib/theme';

const PHOTO = require('../../../assets/images/hall/hall-photo-glass.jpg');
/** Misty mandap and seating, faded in from the left so it melts into the overview card's glass. */
const OVERVIEW_SCENE = require('../../../assets/images/hall/overview-glass.png');

/** Reference artboard width; `u()` maps its units to dp so the screen scales with the device. */
const REF_W = 887;
/** Baseline position as a fraction of font size when lineHeight === fontSize. */
const SERIF_BASE = 0.8765;
const SANS_BASE = 0.8638;

/** Blue glass palette shared with the tab screens. */
const INK = '#131D38';
const NAVY = '#1F3A70';
const BLUE = '#2F63C0';
const LINK = '#1F4488';
const MUTED = '#5B6275';
const LABEL = '#6E7385';

/** Pastel icon tiles for the information rows, matched to the design reference. */
const TONES = {
  blue: { bg: ['#EAF2FE', '#D3E4FB'], fg: BLUE },
  lilac: { bg: ['#F3EEFD', '#E3D8F8'], fg: '#7A3FD0' },
  mint: { bg: ['#E8F8F2', '#CFEFE3'], fg: '#1E8A80' },
  peach: { bg: ['#FFF3E8', '#FDE1CB'], fg: '#E8732A' },
} as const;

export default function HallDetailsScreen() {
  const { hall } = useStore();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { scrollRef, rootRef, scrolled, onScroll } = useSmoothScroll<ScrollView>();
  const { width } = useWindowDimensions();
  const k = appWidth(width) / REF_W;
  const u = (n: number) => n * k;

  /** Absolutely placed single-line text whose baseline sits at `baseline` (reference units). */
  const line = (
    text: ReactNode,
    left: number,
    baseline: number,
    size: number,
    style: TextStyle,
    serif = false,
    right?: number,
  ) => {
    const fs = u(size);
    return (
      <Text
        numberOfLines={1}
        style={[
          style,
          {
            position: 'absolute',
            left: u(left),
            right: right === undefined ? undefined : u(right),
            top: u(baseline) - fs * (serif ? SERIF_BASE : SANS_BASE),
            fontSize: fs,
            lineHeight: fs,
            letterSpacing: serif ? u(-0.9) : undefined,
          },
        ]}>
        {text}
      </Text>
    );
  };

  /** Two-tone serif heading: navy lead word, blue second word. */
  const heading = (lead: string, rest: string, left: number, baseline: number, size: number) =>
    line(
      <>
        {lead} <Text style={{ color: BLUE }}>{rest}</Text>
      </>,
      left,
      baseline,
      size,
      { fontFamily: F.pageSerifBold, color: INK },
      true,
    );

  const rows: { icon: ReactNode; tone: keyof typeof TONES; label: string; value: string }[] = [
    {
      icon: <MaterialCommunityIcons name="domain" size={u(46)} color={TONES.blue.fg} />,
      tone: 'blue',
      label: 'Organisation',
      value: hall.org,
    },
    {
      icon: <Ionicons name="person-outline" size={u(42)} color={TONES.lilac.fg} />,
      tone: 'lilac',
      label: 'Your role',
      value: hall.role,
    },
    {
      icon: <Ionicons name="location-outline" size={u(46)} color={TONES.mint.fg} />,
      tone: 'mint',
      label: 'Address',
      value: hall.address,
    },
    {
      icon: <MaterialCommunityIcons name="phone-in-talk-outline" size={u(44)} color={TONES.peach.fg} />,
      tone: 'peach',
      label: 'Contact',
      value: hall.phone,
    },
  ];

  const card = { left: u(38), width: u(812) };

  return (
    <View ref={rootRef} style={st.screen}>
      <GlassBackdrop />
      <ScrollFade faded={scrolled}>
      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}>
        <View style={{ height: u(1720) + insets.bottom }}>
          {/* Header */}
          <Touchable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={[st.center, glassSurface('rgba(255, 255, 255, 0.55)', u(38)), st.abs, { left: u(42), top: u(42), width: u(76), height: u(76) }]}>
            <Sheen radius={u(38)} strength={0.6} />
            <Ionicons name="arrow-back" size={u(38)} color={BLUE} />
          </Touchable>
          {heading('Hall', 'Details', 145, 101, 56)}

          {/* Hero: hall photo over a frosted name panel */}
          <View style={[st.abs, card, glassSurface('rgba(240, 246, 255, 0.5)', u(36)), { top: u(135), height: u(486) }]}>
            <Sheen radius={u(36)} strength={0.45} />
            <Waves style={{ left: u(380), top: u(330), width: u(430), height: u(154) }} />
            <View style={[st.abs, st.photo, { left: u(2), top: u(2), right: u(2), height: u(314), borderRadius: u(34) }]}>
              <Image source={PHOTO} contentFit="cover" style={StyleSheet.absoluteFill} />
            </View>

            <Touchable
              onPress={() => toast('Photo upload is coming soon')}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              style={[
                st.abs,
                st.pill,
                glassSurface('rgba(255, 255, 255, 0.9)', u(34)),
                { left: u(552), top: u(225), width: u(238), height: u(68), gap: u(14) },
              ]}>
              <Ionicons name="camera-outline" size={u(32)} color={LINK} />
              <Text style={[st.pillText, { color: LINK, fontSize: u(21), lineHeight: u(28) }]}>Change Photo</Text>
            </Touchable>

            <View
              style={[
                st.abs,
                st.center,
                glassSurface('rgba(255, 255, 255, 0.55)', u(24)),
                { left: u(32), top: u(348), width: u(105), height: u(107) },
              ]}>
              <Sheen radius={u(24)} strength={0.6} />
              <MaterialCommunityIcons name="domain" size={u(66)} color={BLUE} />
            </View>
            {line(hall.name, 162, 393, 40, { fontFamily: F.pageSerifBold, color: INK }, true, 262)}
            {line(hall.org, 162, 435, 25, { fontFamily: F.regular, color: MUTED }, false, 262)}

            <Touchable
              onPress={() => toast('Editing hall details is coming soon')}
              accessibilityRole="button"
              accessibilityLabel="Edit details"
              style={[
                st.abs,
                st.pill,
                glassSurface('rgba(236, 243, 254, 0.78)', u(34)),
                { left: u(560), top: u(375), width: u(220), height: u(68), gap: u(12) },
              ]}>
              <MaterialCommunityIcons name="pencil-outline" size={u(28)} color={NAVY} />
              <Text style={[st.pillText, { color: NAVY, fontSize: u(20), lineHeight: u(26) }]}>Edit Details</Text>
              <Ionicons name="arrow-forward" size={u(24)} color={NAVY} />
            </Touchable>
          </View>

          {/* Hall information */}
          <View style={[st.abs, card, glassSurface('rgba(244, 248, 255, 0.52)', u(36)), { top: u(650), height: u(650) }]}>
            <Sheen radius={u(36)} strength={0.4} height="20%" />
            <Waves style={{ left: u(520), top: 0, width: u(292), height: u(150) }} flip />
            {heading('Hall', 'Information', 44, 70, 46)}
            <Underline left={u(44)} top={u(88)} width={u(210)} />
            {rows.map((r, i) => {
              const tone = TONES[r.tone];
              return (
                <View
                  key={r.label}
                  style={[
                    st.abs,
                    glassSurface('rgba(255, 255, 255, 0.42)', u(26)),
                    { left: u(20), right: u(20), top: u(124 + i * 129.5), height: u(120) },
                  ]}>
                  <View style={[st.abs, st.center, st.tile, { left: u(25), top: u(15), width: u(94), height: u(88), borderRadius: u(18) }]}>
                    <TileFill from={tone.bg[0]} to={tone.bg[1]} />
                    {r.icon}
                  </View>
                  {line(r.label, 154, 48, 22.5, { fontFamily: F.regular, color: LABEL }, false, 20)}
                  {line(r.value, 154, 86, 28, { fontFamily: F.medium, color: INK }, false, 20)}
                </View>
              );
            })}
          </View>

          {/* Hall overview */}
          <View style={[st.abs, card, glassSurface('rgba(244, 248, 255, 0.52)', u(36)), { top: u(1330), height: u(338), overflow: 'hidden' }]}>
            <Image
              source={OVERVIEW_SCENE}
              pointerEvents="none"
              style={{ position: 'absolute', right: u(2), top: u(4), width: u(416), height: u(330) }}
            />
            <Sheen radius={u(36)} strength={0.4} height="30%" />
            <Waves style={{ left: u(250), top: u(20), width: u(560), height: u(300) }} flip />
            {heading('Hall', 'Overview', 44, 78, 46)}
            <Underline left={u(44)} top={u(96)} width={u(210)} />
            <View style={[st.abs, st.center, st.tile, { left: u(44), top: u(162), width: u(114), height: u(116), borderRadius: u(26) }]}>
              <TileFill from={TONES.lilac.bg[0]} to={TONES.lilac.bg[1]} />
              <Ionicons name="people-outline" size={u(64)} color={TONES.lilac.fg} />
            </View>
            {line('Capacity', 198, 192, 22.5, { fontFamily: F.regular, color: LABEL })}
            {line(hall.capacity, 198, 248, 42, { fontFamily: F.pageSerifBold, color: INK }, true, 400)}
          </View>
        </View>
      </ScrollView>
      </ScrollFade>
    </View>
  );
}

/** SVG ids must be unique per document on web; React ids contain characters `url(#…)` rejects. */
function useSvgId(prefix: string) {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

/** Soft pastel gradient behind an icon tile. */
function TileFill({ from, to }: { from: string; to: string }) {
  const id = useSvgId('tf');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Blue accent rule under section titles: a solid bar, a dot, then a hairline fading out. */
function Underline({ left, top, width }: { left: number; top: number; width: number }) {
  const id = useSvgId('ul');
  return (
    <Svg
      width={width}
      height={(width * 10) / 210}
      viewBox="0 0 210 10"
      style={{ position: 'absolute', left, top }}
      pointerEvents="none">
      <Defs>
        <LinearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={BLUE} />
          <Stop offset="1" stopColor="#6FA2EE" />
        </LinearGradient>
        <LinearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8DB4F0" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#8DB4F0" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={3.3} width={90} height={3.4} rx={1.7} fill={`url(#${id}a)`} />
      <Circle cx={95} cy={5} r={3.6} fill={BLUE} />
      <Rect x={101} y={4.2} width={109} height={1.6} fill={`url(#${id}b)`} />
    </Svg>
  );
}

/** Faint white light-trails drawn across a corner of a glass card. */
function Waves({ style, flip }: { style: { left: number; top: number; width: number; height: number }; flip?: boolean }) {
  return (
    <View pointerEvents="none" style={[st.abs, style, flip && { transform: [{ scaleY: -1 }] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
        {[0, 10, 20, 32].map((o, i) => (
          <Path
            key={o}
            d={`M0 ${150 - o}C120 ${140 - o} 220 ${70 - o} 400 ${20 - o * 0.6}`}
            stroke="#FFFFFF"
            strokeOpacity={0.5 - i * 0.1}
            strokeWidth={1.4}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E6EEF9' },
  abs: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  photo: { overflow: 'hidden', boxShadow: '0px 6px 16px rgba(31, 58, 112, 0.12)' },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: F.medium },
  tile: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: 'inset 0px 1px 0px rgba(255, 255, 255, 1), 0px 0px 10px rgba(255, 255, 255, 0.8), 0px 4px 10px rgba(31, 58, 112, 0.08)',
  },
});
