import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useId, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useToast } from '@/components/overlays';
import { goBack, Touchable } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { appWidth, F } from '@/lib/theme';

const PHOTO = require('../../../assets/images/hall/hall-photo.jpg');
const PANEL_FLORAL = require('../../../assets/images/hall/panel-floral.png');
const PAGE_FLORAL = require('../../../assets/images/hall/page-floral.png');
const INFO_FLORAL = require('../../../assets/images/hall/info-floral.png');
const OVERVIEW_SCENE = require('../../../assets/images/hall/overview-scene.png');

/** Reference artboard width; `u()` maps its units to dp so the screen scales with the device. */
const REF_W = 887;
/** Baseline position as a fraction of font size when lineHeight === fontSize. */
const SERIF_BASE = 0.8765;
const SANS_BASE = 0.8638;

const BG = '#FBF7F2';
const BURGUNDY = '#6E0C28';
const PANEL = '#6B0C28';
const GOLD = '#B08A5A';
const ICON = '#9E1257';
const LABEL = '#6E6D76';
const VALUE = '#111013';

export default function HallDetailsScreen() {
  const { hall } = useStore();
  const toast = useToast();
  const insets = useSafeAreaInsets();
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
            // PT Serif runs ~5% wider than the reference face; tighten to match its measure.
            letterSpacing: serif ? u(-1.3) : undefined,
          },
        ]}>
        {text}
      </Text>
    );
  };

  const rows: { icon: ReactNode; label: string; value: string }[] = [
    { icon: <BuildingIcon color={ICON} width={u(38)} />, label: 'Organisation', value: hall.org },
    { icon: <Ionicons name="person-outline" size={u(44)} color={ICON} />, label: 'Your role', value: hall.role },
    { icon: <Ionicons name="location-outline" size={u(48)} color={ICON} />, label: 'Address', value: hall.address },
    {
      icon: <MaterialCommunityIcons name="phone-in-talk-outline" size={u(46)} color={ICON} />,
      label: 'Contact',
      value: hall.phone,
    },
  ];

  const card = { left: u(42), width: u(804), borderRadius: u(30) };

  return (
    <View style={st.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top }}>
        <View style={{ height: u(1740) + insets.bottom }}>
          <Image
            source={PAGE_FLORAL}
            pointerEvents="none"
            style={{ position: 'absolute', left: u(600), top: 0, width: u(287), height: u(345) }}
          />

          {/* Header */}
          <Touchable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            style={{ position: 'absolute', left: u(50), top: u(38), width: u(48), height: u(46) }}>
            <Svg width="100%" height="100%" viewBox="50 38 48 46">
              <Path
                d="M92 61H58M74 45L57.5 61L74 77"
                stroke="#5E0620"
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Touchable>
          {line(
            <>
              Hall <Text style={{ color: GOLD }}>Details</Text>
            </>,
            135,
            81,
            51.4,
            { fontFamily: F.pageSerifBold, color: BURGUNDY },
            true,
          )}

          {/* Hero: hall photo over a burgundy name panel */}
          <View style={[st.card, st.hero, card, { top: u(135), height: u(501) }]}>
            <Image source={PHOTO} contentFit="cover" style={{ width: '100%', height: u(312) }} />
            <View style={{ flex: 1, backgroundColor: PANEL }}>
              <Image
                source={PANEL_FLORAL}
                pointerEvents="none"
                style={{ position: 'absolute', left: u(478), top: 0, width: u(326), height: u(189) }}
              />
            </View>

            <Touchable
              onPress={() => toast('Photo upload is coming soon')}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              style={[
                st.photoPill,
                { left: u(543), top: u(225), width: u(240), height: u(66), borderRadius: u(33), gap: u(16) },
              ]}>
              <Ionicons name="camera-outline" size={u(34)} color="#5E0B20" />
              <Text style={[st.pillText, { color: '#5E0B20', fontSize: u(22.5), lineHeight: u(28) }]}>Change Photo</Text>
            </Touchable>

            <View style={{ position: 'absolute', left: u(42), top: u(376) }}>
              <BuildingIcon color="#F7F4F5" width={u(62)} />
            </View>
            {line(hall.name, 140, 399, 44.3, { fontFamily: F.pageSerifBold, color: '#FFFFFF' }, true, 250)}
            {line(hall.org, 140, 451, 29.5, { fontFamily: F.regular, color: '#D3A493' }, false, 250)}

            <Touchable
              onPress={() => toast('Editing hall details is coming soon')}
              accessibilityRole="button"
              accessibilityLabel="Edit details"
              style={[
                st.editPill,
                { left: u(572), top: u(381), width: u(202), height: u(67), borderRadius: u(33.5), gap: u(14) },
              ]}>
              <MaterialCommunityIcons name="pencil-outline" size={u(32)} color="#E2B99B" />
              <Text style={[st.pillText, { color: '#EACBB2', fontSize: u(22), lineHeight: u(28) }]}>Edit Details</Text>
            </Touchable>
          </View>

          {/* Hall information */}
          <View style={[st.card, st.infoCard, card, { top: u(660), height: u(675) }]}>
            <Image
              source={INFO_FLORAL}
              pointerEvents="none"
              style={{ position: 'absolute', left: u(628), top: 0, width: u(175), height: u(184) }}
            />
            {line('Hall Information', 40, 77, 42.9, { fontFamily: F.pageSerifBold, color: '#7A0E30' }, true)}
            <Ornament left={u(40)} top={u(100)} width={u(180)} />
            {rows.map((r, i) => {
              const top = 150 + i * 133.3;
              return (
                <View key={r.label}>
                  <View style={[st.iconBox, { left: u(40), top: u(top), width: u(83), height: u(82), borderRadius: u(20) }]}>
                    {r.icon}
                  </View>
                  {line(r.label, 160, top + 27, 24.5, { fontFamily: F.regular, color: LABEL }, false, 20)}
                  {line(r.value, 160, top + 67, 30, { fontFamily: F.regular, color: VALUE }, false, 20)}
                  {i < rows.length - 1 ? (
                    <View style={[st.sep, { left: u(40), right: u(39), top: u(top + 105), height: u(1.6) }]} />
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Hall overview */}
          <View style={[st.card, st.overviewCard, card, { top: u(1360), height: u(320) }]}>
            <Image
              source={OVERVIEW_SCENE}
              pointerEvents="none"
              style={{ position: 'absolute', left: u(378), top: u(1), width: u(425), height: u(319) }}
            />
            {line('Hall Overview', 45, 80, 42.9, { fontFamily: F.pageSerifBold, color: '#A0115A' }, true)}
            <Ornament left={u(45)} top={u(105)} width={u(180)} />
            <View style={[st.capBox, { left: u(45), top: u(160), width: u(112), height: u(114), borderRadius: u(26) }]}>
              <MaterialCommunityIcons name="account-group-outline" size={u(72)} color="#9A1649" />
            </View>
            {line('Capacity', 197, 189, 24.5, { fontFamily: F.regular, color: '#75717A' })}
            {line(hall.capacity, 196, 240, 42.5, { fontFamily: F.pageSerifBold, color: BURGUNDY }, true, 380)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** White tower + annexe glyph used for the hall; drawn on a 62×66 grid. */
function BuildingIcon({ color, width }: { color: string; width: number }) {
  const win = (x: number, y: number, w = 5, h = 5) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const tower = [7, 16.5, 26].flatMap((x) => [6, 15, 24, 33, 42].map((y) => win(x, y)));
  const annexe = [45, 53].flatMap((x) => [30, 38, 46].map((y) => win(x, y, 4, 4)));
  const d = [
    'M0 0H38V66H0Z',
    ...tower,
    win(15, 52, 8, 14),
    'M40 23H62V66H40Z',
    ...annexe,
  ].join('');
  return (
    <Svg width={width} height={width * (66 / 62)} viewBox="0 0 62 66">
      <Path d={d} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

/** Gold rule with a hollow diamond, set under section titles. */
function Ornament({ left, top, width }: { left: number; top: number; width: number }) {
  const id = `orn-${useId().replace(/:/g, '')}`;
  return (
    <Svg
      width={width}
      height={(width * 16) / 180}
      viewBox="0 0 180 16"
      style={{ position: 'absolute', left, top }}
      pointerEvents="none">
      <Defs>
        <LinearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#C9A27A" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#C9A27A" stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#C9A27A" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#C9A27A" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="7.2" width="86" height="1.8" fill={`url(#${id}-l)`} />
      <Path d="M99.5 2L105.5 8L99.5 14L93.5 8Z" stroke="#BD936A" strokeWidth={2.2} fill="none" />
      <Rect x="112" y="7.2" width="68" height="1.8" fill={`url(#${id}-r)`} />
    </Svg>
  );
}

const shadow = '0px 6px 18px rgba(120, 80, 60, 0.10)';

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  card: { position: 'absolute', boxShadow: shadow },
  hero: { overflow: 'hidden', backgroundColor: PANEL },
  infoCard: { overflow: 'hidden', backgroundColor: '#FEFDFB', borderWidth: 1, borderColor: '#EFE8E2' },
  overviewCard: { overflow: 'hidden', backgroundColor: '#FCF6F7', borderWidth: 1, borderColor: '#EFE6E4' },
  photoPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252, 238, 240, 0.96)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  editPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PANEL,
    borderWidth: 1.5,
    borderColor: '#DDAB8F',
  },
  pillText: { fontFamily: F.medium },
  iconBox: { position: 'absolute', backgroundColor: '#FCEEF0', alignItems: 'center', justifyContent: 'center' },
  sep: { position: 'absolute', backgroundColor: '#EEE7E1' },
  capBox: { position: 'absolute', backgroundColor: '#F9E7EA', alignItems: 'center', justifyContent: 'center' },
});
