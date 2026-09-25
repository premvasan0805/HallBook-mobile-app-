import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useId, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText, TSpan } from 'react-native-svg';

import { Touchable } from '@/components/primitives';
import { initials, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { appWidth, F } from '@/lib/theme';

/** Burgundy panel with the lotus mandala and mandap scene, with the live text and buttons removed. */
const BG = require('../../assets/images/header/brand-header-card.jpg');

/** Reference artboard the header is laid out against; `k` maps its units to dp. */
const REF_W = 2098;
const REF_H = 503;
/** Gold rim showing under the panel's bottom edge, and the corner radius both share. */
const RIM = 16;
const RADIUS = 104;

const IVORY = '#FFFFFF';
const GOLD = '#E8BD6C';
const RIM_GOLD = '#EEC680';
const BOOK_STOPS = [
  [0, '#FBE3A5'],
  [0.35, '#F6CC78'],
  [0.7, '#EDBE6B'],
  [1, '#E0AA58'],
] as const;

/**
 * Burgundy header shared by the Bookings, Customers and Settings tabs: wordmark and hall switcher on
 * the left, lotus mandala and mandap scene on the right with bell and profile, over a gold bottom rim.
 */
export function CompactBrandHeader({ topInset, showProfile = true }: { topInset: number; showProfile?: boolean }) {
  const { hall, bookings } = useStore();
  const { width } = useWindowDimensions();
  const today = todayISO();
  const hasUpcoming = bookings.some((b) => b.status !== 'cancelled' && b.date >= today);
  const id = `hdr-${useId().replace(/:/g, '')}`;
  // Scale to the header's own width: some screens inset it inside padded scroll content.
  const [measured, setMeasured] = useState(0);
  const k = (measured || appWidth(width)) / REF_W;
  const u = (n: number) => n * k;

  const artH = u(REF_H);
  const radius = u(RADIUS);
  const avatar = u(178);
  const dot = u(34);

  return (
    <View
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      style={[
        st.rim,
        { height: topInset + artH + u(RIM), borderBottomLeftRadius: radius, borderBottomRightRadius: radius },
      ]}>
      <View style={[st.panel, { height: topInset + artH, borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}>
        {/* The status-bar strip mirrors the artwork's top rows so the panel runs to the screen edge. */}
        {topInset > 0 ? (
          <Image
            source={BG}
            contentFit="fill"
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: topInset - artH, height: artH, transform: [{ scaleY: -1 }] }}
          />
        ) : null}
        <Image source={BG} contentFit="fill" pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: topInset, height: artH }} />

        <View style={{ position: 'absolute', left: 0, right: 0, top: topInset, height: artH }}>
          {/* Wordmark: ivory "Hall", gold-foil "Book" */}
          <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${REF_W} ${REF_H}`}>
            <Defs>
              <LinearGradient id={`${id}-book`} x1="0" y1="0" x2="0" y2="1">
                {BOOK_STOPS.map(([o, c]) => (
                  <Stop key={o} offset={o} stopColor={c} />
                ))}
              </LinearGradient>
            </Defs>
            <SvgText x={100} y={254} fontFamily={F.pageSerifBold} fontSize={182} letterSpacing={-2} fill={IVORY}>
              <TSpan>Hall</TSpan>
              <TSpan fill={`url(#${id}-book)`}>Book</TSpan>
            </SvgText>
          </Svg>

          <Touchable
            onPress={() => router.push('/settings/hall')}
            accessibilityLabel="Hall details"
            style={[st.row, { left: u(96), top: u(290), height: u(126), maxWidth: u(1000) }]}>
            <MaterialCommunityIcons name="bank" size={u(142)} color={GOLD} />
            <Text numberOfLines={1} style={[st.hallName, { marginLeft: u(36), fontSize: u(71), lineHeight: u(86) }]}>
              {hall.name}
            </Text>
            <Ionicons name="chevron-down" size={u(78)} color={IVORY} style={{ marginLeft: u(30), marginTop: u(6) }} />
          </Touchable>

          <Touchable
            onPress={() => router.push('/settings/notifications')}
            accessibilityLabel="Notifications"
            hitSlop={10}
            style={[st.center, { position: 'absolute', left: u(1722 - 80), top: u(143 - 80), width: u(160), height: u(160) }]}>
            <Ionicons name="notifications" size={u(136)} color={IVORY} />
            {hasUpcoming ? (
              <View
                style={[
                  st.bellDot,
                  {
                    left: u(1752 - 1642) - dot / 2,
                    top: u(101 - 63) - dot / 2,
                    width: dot,
                    height: dot,
                    borderRadius: dot / 2,
                    borderWidth: Math.max(u(4), 1),
                  },
                ]}
              />
            ) : null}
          </Touchable>

          {showProfile ? (
            <Touchable
              onPress={() => router.push('/more')}
              accessibilityLabel="Profile"
              style={[
                st.avatar,
                {
                  left: u(1936) - avatar / 2,
                  top: u(158) - avatar / 2,
                  width: avatar,
                  height: avatar,
                  borderRadius: avatar / 2,
                  borderWidth: Math.max(u(6), 1.5),
                },
              ]}>
              <Text style={[st.avatarText, { fontSize: u(96), lineHeight: u(116) }]}>{initials(hall.role)}</Text>
            </Touchable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  rim: { backgroundColor: RIM_GOLD, boxShadow: '0px 6px 14px rgba(70, 20, 25, 0.18)' },
  panel: { overflow: 'hidden', backgroundColor: '#5E0620' },
  row: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  hallName: { fontFamily: F.pageSerif, color: IVORY, flexShrink: 1 },
  bellDot: { position: 'absolute', backgroundColor: '#E5252F', borderColor: IVORY },
  avatar: {
    position: 'absolute',
    backgroundColor: '#C89D6E',
    borderColor: IVORY,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(30, 5, 10, 0.3)',
  },
  avatarText: { fontFamily: F.pageSerif, color: IVORY },
});

/** Burgundy panel, gold swoosh, venue photo and quote, with the live text and buttons removed. */
const PHOTO_BG = require('../../assets/images/header/brand-header-bg.jpg');

/** Reference artboard the photo header is laid out against. */
const PHOTO_REF_W = 2095;
const PHOTO_REF_H = 665;
const PHOTO_RADIUS = 64;

const PHOTO_GOLD = '#F2C774';
const PHOTO_TAGLINE = '#E8C37B';
const PHOTO_BOOK_STOPS = [
  [0, '#F6CC78'],
  [0.3, '#FBE3A5'],
  [0.6, '#F3C97A'],
  [1, '#E3AE5A'],
] as const;

/**
 * Burgundy header for the Calendar tab: wordmark, hall switcher and tagline on the left, the venue
 * photo behind a gold swoosh on the right with bell, profile and quote.
 */
export function PhotoBrandHeader({ topInset }: { topInset: number }) {
  const { hall, bookings } = useStore();
  const { width } = useWindowDimensions();
  const today = todayISO();
  const hasUpcoming = bookings.some((b) => b.status !== 'cancelled' && b.date >= today);
  const id = `phdr-${useId().replace(/:/g, '')}`;
  const [measured, setMeasured] = useState(0);
  const k = (measured || appWidth(width)) / PHOTO_REF_W;
  const u = (n: number) => n * k;

  const artH = u(PHOTO_REF_H);
  const bell = u(125);
  const avatar = u(132);

  return (
    <View
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      style={[
        pst.header,
        { height: topInset + artH, borderBottomLeftRadius: u(PHOTO_RADIUS), borderBottomRightRadius: u(PHOTO_RADIUS) },
      ]}>
      {/* The status-bar strip mirrors the artwork's top rows so the photo runs to the screen edge. */}
      {topInset > 0 ? (
        <Image
          source={PHOTO_BG}
          contentFit="fill"
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: topInset - artH, height: artH, transform: [{ scaleY: -1 }] }}
        />
      ) : null}
      <Image source={PHOTO_BG} contentFit="fill" pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: topInset, height: artH }} />

      <View style={{ position: 'absolute', left: 0, right: 0, top: topInset, height: artH }}>
        {/* Wordmark: ivory "Hall", gold-foil "Book" */}
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${PHOTO_REF_W} ${PHOTO_REF_H}`}>
          <Defs>
            <LinearGradient id={`${id}-book`} x1="0" y1="0" x2="0" y2="1">
              {PHOTO_BOOK_STOPS.map(([o, c]) => (
                <Stop key={o} offset={o} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <SvgText x={123} y={260} fontFamily={F.serifBold} fontSize={215} letterSpacing={-5} fill={IVORY}>
            Hall
          </SvgText>
          <SvgText x={486} y={260} fontFamily={F.serifBold} fontSize={215} letterSpacing={-1} fill={`url(#${id}-book)`}>
            Book
          </SvgText>
        </Svg>

        <Touchable
          onPress={() => router.push('/settings/hall')}
          accessibilityLabel="Hall details"
          style={[pst.row, { left: u(113), top: u(302), height: u(95), maxWidth: u(1000) }]}>
          <MaterialCommunityIcons name="bank" size={u(92)} color={PHOTO_GOLD} />
          <Text numberOfLines={1} style={[pst.hallName, { marginLeft: u(42), fontSize: u(79), lineHeight: u(95) }]}>
            {hall.name}
          </Text>
          <Ionicons name="chevron-down" size={u(67)} color={IVORY} style={{ marginLeft: u(27), marginTop: u(8) }} />
        </Touchable>

        <View
          pointerEvents="none"
          style={[pst.abs, { left: u(121), top: u(433), width: u(80), height: Math.max(u(5), 1), backgroundColor: PHOTO_GOLD }]}
        />
        <Text
          pointerEvents="none"
          numberOfLines={1}
          style={[pst.tagline, { left: u(241), top: u(432), fontSize: u(34), lineHeight: u(41), letterSpacing: u(7.8) }]}>
          Celebrate Beautiful Beginnings
        </Text>

        <Touchable
          onPress={() => router.push('/settings/notifications')}
          accessibilityLabel="Notifications"
          hitSlop={10}
          style={[pst.bell, { left: u(1773.5) - bell / 2, top: u(146.5) - bell / 2, width: bell, height: bell, borderRadius: bell / 2 }]}>
          <Ionicons name="notifications-outline" size={u(76)} color="#1F1A17" />
          {hasUpcoming ? (
            <View style={[pst.bellDot, { left: u(1806 - 1711 - 13), top: u(117 - 84 - 13), width: u(26), height: u(26), borderRadius: u(13) }]} />
          ) : null}
        </Touchable>

        <View pointerEvents="none" style={[pst.divider, { left: u(1867), top: u(99), width: Math.max(u(3), 1), height: u(95) }]} />
        <Touchable
          onPress={() => router.push('/more')}
          accessibilityLabel="Profile"
          style={[
            pst.avatar,
            {
              left: u(1963) - avatar / 2,
              top: u(146.5) - avatar / 2,
              width: avatar,
              height: avatar,
              borderRadius: avatar / 2,
              borderWidth: Math.max(u(5), 1),
            },
          ]}>
          <Text style={[pst.avatarText, { fontSize: u(70), lineHeight: u(84) }]}>{initials(hall.role)}</Text>
        </Touchable>
      </View>
    </View>
  );
}

const pst = StyleSheet.create({
  header: { overflow: 'hidden', backgroundColor: '#620D24' },
  abs: { position: 'absolute' },
  row: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  hallName: { fontFamily: F.serifBold, color: IVORY, flexShrink: 1 },
  tagline: { position: 'absolute', fontFamily: F.medium, color: PHOTO_TAGLINE },
  bell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF2E7',
    boxShadow: '0px 2px 6px rgba(60, 20, 10, 0.25)',
  },
  bellDot: { position: 'absolute', backgroundColor: '#F3162D' },
  divider: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.9)' },
  avatar: {
    position: 'absolute',
    backgroundColor: '#B88843',
    borderColor: IVORY,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(60, 20, 10, 0.25)',
  },
  avatarText: { fontFamily: F.medium, color: IVORY },
});
