import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { backdropBlur, GradientFill, glassTier, Sheen } from '@/components/glass';
import { Touchable } from '@/components/primitives';
import { appWidth, F, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/theme-context';

/** Banyan Meadows tree + wordmark (gold on transparent). */
const LOGO = require('../../assets/images/brand/logo-mark.png');
const LOGO_ASPECT = 360 / 377;
const TAGLINE = '“A Space for Every Age, A Celebration for Every Stage”';

/** Home is designed at 430dp wide; `s(dp)` scales a design dp to the current width. */
const DESIGN_WIDTH = 430;

/**
 * Home header: Banyan Meadows logo, glass notification/profile orbs, the hall selector capsule and the frosted
 * "Today's Bookings" panel. Everything is real glass over the blurred venue backdrop — the gold is only an accent.
 */
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
  const s = (dp: number) => (appWidth(width) / DESIGN_WIDTH) * dp;
  const t = useTheme();
  const INK = t.G.ink;
  const GOLD = t.G.blue;
  const pad = s(18);
  const orb = s(46);
  const logoH = s(96);

  return (
    <View style={{ paddingHorizontal: pad, paddingTop: s(6), zIndex: 1 }}>
      {/* Logo + tagline, bell and avatar */}
      <View style={st.row}>
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={`The Banyan Meadows. ${greeting}, ${name}`}
          style={{ flex: 1, alignItems: 'flex-start' }}>
          <Image
            source={LOGO}
            contentFit="contain"
            style={{ height: logoH, width: logoH * LOGO_ASPECT, marginLeft: s(22) }}
          />
          <Text
            numberOfLines={1}
            style={{
              marginTop: s(3),
              fontFamily: F.regular,
              fontSize: Math.max(s(9.5), 9),
              lineHeight: Math.max(s(13), 12),
              color: t.dark ? t.G.navy : '#4B4640',
              letterSpacing: 0.1,
            }}>
            {TAGLINE}
          </Text>
        </View>
        <View style={[st.row, { gap: s(12), alignSelf: 'flex-start', marginTop: s(4) }]}>
          <Touchable
            onPress={onAlerts}
            accessibilityLabel="Notifications"
            style={[st.center, glassOrb(t, orb)]}>
            <Ionicons name="notifications-outline" size={s(22)} color={INK} />
            {hasAlerts ? (
              <View
                style={{
                  position: 'absolute',
                  top: s(11),
                  right: s(12),
                  width: s(8),
                  height: s(8),
                  borderRadius: s(4),
                  backgroundColor: t.C.danger,
                  borderWidth: 1.5,
                  borderColor: t.dark ? '#2A2622' : 'rgba(255, 255, 255, 0.95)',
                }}
              />
            ) : null}
          </Touchable>
          <Touchable onPress={onProfile} accessibilityLabel="Profile" style={[st.center, glassOrb(t, orb)]}>
            <Text style={{ fontFamily: F.semibold, fontSize: s(16), lineHeight: s(20), color: INK, letterSpacing: 0.2 }}>{initials}</Text>
          </Touchable>
        </View>
      </View>

      {/* Hall selector capsule */}
      <Touchable
        onPress={onHall}
        accessibilityLabel="Hall details"
        style={[
          st.row,
          glassTier(t, 'secondary', s(24)),
          { alignSelf: 'flex-start', marginTop: s(12), height: s(44), paddingLeft: s(4), paddingRight: s(14), gap: s(10), maxWidth: '80%' },
        ]}>
        <Sheen radius={s(24)} strength={0.5} height="50%" />
        <View style={[st.center, glassOrb(t, s(34), true)]}>
          <MaterialCommunityIcons name="bank" size={s(18)} color={GOLD} />
        </View>
        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: F.semibold, fontSize: s(14.5), lineHeight: s(19), color: INK }}>
          {hallName}
        </Text>
        <Ionicons name="chevron-forward" size={s(16)} color={INK} />
      </Touchable>

      {/* Today's bookings — large frosted glass panel */}
      <Touchable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Today's bookings: ${count}. ${title}. ${subtitle}`}
        style={[glassTier(t, 'primary', s(24)), { marginTop: s(14), paddingHorizontal: s(16), paddingTop: s(14), paddingBottom: s(16), overflow: 'hidden' }]}>
        <Sheen radius={s(24)} strength={0.55} height="46%" />
        <Reflection t={t} />
        <View style={[st.row, { gap: s(12) }]}>
          <View style={[st.center, goldTile(t, s(42), s(12))]}>
            <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={s(12)} fromOpacity={0.55} toOpacity={0.4} />
            <MaterialCommunityIcons name="calendar-month-outline" size={s(22)} color={t.dark ? '#FFF4DA' : '#FFFFFF'} />
          </View>
          <Text style={{ fontFamily: F.semibold, fontSize: s(19), lineHeight: s(26), color: INK, letterSpacing: -0.3 }}>Today&apos;s Bookings</Text>
          <GoldRule width={s(70)} color={GOLD} />
        </View>

        <View style={[st.row, { marginTop: s(10) }]}>
          <Text
            style={{
              width: s(42),
              textAlign: 'center',
              fontFamily: F.semibold,
              fontSize: s(40),
              lineHeight: s(52),
              letterSpacing: -0.8,
              color: INK,
              fontVariant: ['lining-nums'],
            }}>
            {count}
          </Text>
          <View style={{ width: 1, height: s(40), marginHorizontal: s(12), backgroundColor: t.G.rule }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: s(16), lineHeight: s(22), color: INK, letterSpacing: -0.1 }}>
              {title}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: Math.max(s(12), 11), lineHeight: s(17), color: t.G.muted }}>
              {subtitle}
            </Text>
          </View>
          {/* View — a gold-lit glass capsule */}
          <View
            style={[
              st.row,
              {
                marginLeft: s(8),
                height: s(38),
                paddingHorizontal: s(16),
                gap: s(6),
                borderRadius: s(19),
                borderWidth: 1,
                borderColor: t.G.buttonBorder,
                overflow: 'hidden',
                boxShadow: t.G.buttonGlow,
                ...backdropBlur(20),
              },
            ]}>
            <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={s(19)} horizontal fromOpacity={0.62} toOpacity={0.46} />
            <Sheen radius={s(19)} strength={0.5} height="50%" />
            <Text style={st.viewText(s)}>View</Text>
            <Ionicons name="arrow-forward" size={s(16)} color="#FFFFFF" />
          </View>
        </View>
      </Touchable>
    </View>
  );
}

/** Round translucent glass button (bell, avatar, hall icon). */
function glassOrb(t: Theme, size: number, inner = false) {
  return {
    ...glassTier(t, 'secondary', size / 2),
    width: size,
    height: size,
    backgroundColor: inner ? t.frost(0.45) : t.dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.35)',
  };
}

/** Small icon tile lit with translucent gold. */
function goldTile(t: Theme, size: number, radius: number) {
  return {
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: t.G.buttonBorder,
    overflow: 'hidden' as const,
    boxShadow: t.G.buttonGlow,
  };
}

/** Thin gold line fading out to a tiny diamond — the panel's subtle accent. */
function GoldRule({ width, color }: { width: number; color: string }) {
  return (
    <Svg width={width} height={8} viewBox="0 0 100 8" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="heroRule" x1="0" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={0.15} />
          <Stop offset="1" stopColor={color} stopOpacity={0.85} />
        </LinearGradient>
      </Defs>
      <Path d="M0 4H90" stroke="url(#heroRule)" strokeWidth={1.2} />
      <Path d="M95 1L98.5 4L95 7L91.5 4Z" fill={color} />
    </Svg>
  );
}

/** A single soft curved reflection across the upper right of the glass, like light on a pane. */
function Reflection({ t }: { t: Theme }) {
  const k = t.dark ? 0.35 : 1;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 130" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="heroRefl" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.45 * k} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.1 * k} />
          </LinearGradient>
        </Defs>
        <Path d="M180 0C230 26 300 34 400 18" stroke="url(#heroRefl)" strokeWidth={1.2} fill="none" />
        <Path d="M220 0C270 18 330 22 400 10V0Z" fill="#FFFFFF" fillOpacity={0.08 * k} />
      </Svg>
    </View>
  );
}

const st = {
  ...StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    center: { alignItems: 'center', justifyContent: 'center' },
  }),
  viewText: (s: (n: number) => number) => ({
    fontFamily: F.medium,
    fontSize: s(14),
    lineHeight: s(18),
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(90, 60, 10, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }),
};
