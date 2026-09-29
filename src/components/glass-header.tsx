import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BlueWash, glassSurface, GradientFill, Sheen } from '@/components/glass';
import { goBack, Touchable } from '@/components/primitives';
import { initials, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

/** Pre-blurred venue photo shared with Home; glass surfaces sit translucent over it. */
export const GLASS_BACKDROP = require('../../assets/images/home/home-backdrop.jpg');

/** Full-bleed page backdrop for a `Screen`. */
export function GlassBackdrop() {
  return (
    <>
      <Image source={GLASS_BACKDROP} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      <BlueWash />
    </>
  );
}

const INK = '#131D38';
const NAVY = '#1F3A70';
const BLUE = '#2F63C0';

/**
 * Blue glass header for the Bookings, Customers and Settings tabs: navy/blue "HallBook" wordmark and hall
 * switcher on the left, frosted bell and profile buttons on the right, all over the venue photo.
 */
export function GlassBrandHeader({
  showProfile = true,
  tagline,
  hallIcon = 'office-building',
}: {
  showProfile?: boolean;
  tagline?: string;
  /** Glyph before the hall name: modern block or classical columns. */
  hallIcon?: 'office-building' | 'bank';
}) {
  const { hall, bookings } = useStore();
  const today = todayISO();
  const hasUpcoming = bookings.some((b) => b.status !== 'cancelled' && b.date >= today);

  return (
    <View style={st.wrap}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.wordmark} numberOfLines={1}>
          Hall<Text style={{ color: BLUE }}>Book</Text>
        </Text>
        <Touchable
          onPress={() => router.push('/settings/hall')}
          accessibilityLabel="Hall details"
          style={st.hallRow}>
          <MaterialCommunityIcons name={hallIcon} size={22} color={NAVY} />
          <Text numberOfLines={1} style={st.hallName}>
            {hall.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color={INK} />
        </Touchable>
        {tagline ? (
          <Text style={st.tagline} numberOfLines={1}>
            {tagline}
          </Text>
        ) : null}
      </View>

      <View style={st.actions}>
        <Touchable
          onPress={() => router.push('/settings/notifications')}
          accessibilityLabel="Notifications"
          style={st.orb}>
          <Ionicons name="notifications-outline" size={20} color={INK} />
          {hasUpcoming ? <View style={st.dot} /> : null}
        </Touchable>
        {showProfile ? (
          <Touchable onPress={() => router.push('/more')} accessibilityLabel="Profile" style={[st.orb, st.avatar]}>
            <Text style={st.avatarText}>{initials(hall.role)}</Text>
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}

/** Glass settings-page header: frosted back orb, two-tone serif title and the hall switcher under it. */
export function GlassPageHeader({
  lead,
  accent,
  hallIcon,
}: {
  lead: string;
  accent: string;
  /** Optional glyph before the hall name. */
  hallIcon?: 'bank' | 'office-building';
}) {
  const { hall } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.page, { paddingTop: insets.top + 14 }]}>
      <Touchable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={[st.back, glassSurface('rgba(255, 255, 255, 0.55)', 18)]}>
        <Sheen radius={18} strength={0.6} />
        <Ionicons name="arrow-back" size={18} color={NAVY} />
      </Touchable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.pageTitle} numberOfLines={1}>
          {lead} <Text style={{ color: BLUE }}>{accent}</Text>
        </Text>
        <Touchable onPress={() => router.push('/settings/hall')} accessibilityLabel="Hall details" style={st.pageHall}>
          {hallIcon ? <MaterialCommunityIcons name={hallIcon} size={15} color={NAVY} /> : null}
          <Text style={st.pageHallName} numberOfLines={1}>
            {hall.name}
          </Text>
          <Ionicons name="chevron-down" size={12} color={INK} />
        </Touchable>
      </View>
    </View>
  );
}

/** Glossy blue call-to-action pinned under a glass page, with a white rim, blue glow and light trails. */
export function GlassCta({
  title,
  icon,
  onPress,
  disabled,
}: {
  title: string;
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
      <Touchable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[st.cta, disabled && { opacity: 0.6 }]}>
        <GradientFill from="#5B8DE0" to="#1F3F92" radius={11} />
        <Sheen radius={11} strength={0.35} height="50%" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 11, overflow: 'hidden' }]}>
          <Svg width="100%" height="100%" viewBox="0 0 400 50" preserveAspectRatio="none">
            <Path d="M20 50C70 30 110 12 170 0" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1} fill="none" />
            <Path d="M40 50C85 34 125 16 190 0" stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={1} fill="none" />
            <Path d="M300 50C335 32 365 14 400 6" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} fill="none" />
            <Path d="M330 50C360 36 380 24 400 18" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={1} fill="none" />
          </Svg>
        </View>
        {icon}
        <Text style={st.ctaText}>{title}</Text>
      </Touchable>
    </View>
  );
}

const ORB = 40;

const st = StyleSheet.create({
  page: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: F.pageSerifBold, fontSize: 25, lineHeight: 31, letterSpacing: -0.4, color: INK },
  pageHall: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 1 },
  pageHallName: { fontFamily: F.regular, fontSize: 13, color: INK, flexShrink: 1 },
  ctaWrap: { paddingHorizontal: 18, paddingTop: 8 },
  cta: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(210, 228, 255, 0.95)',
    boxShadow:
      'inset 0px 1px 0px rgba(255, 255, 255, 0.6), 0px 0px 0px 1px rgba(255, 255, 255, 0.7), 0px 0px 14px rgba(120, 170, 255, 0.55), 0px 8px 18px rgba(31, 63, 146, 0.3)',
  },
  ctaText: { fontFamily: F.pageSerifBold, fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 26,
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 18,
    zIndex: 1,
  },
  wordmark: { fontFamily: F.pageSerifBold, fontSize: 40, lineHeight: 50, color: INK, letterSpacing: -1.4 },
  hallRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2, alignSelf: 'flex-start', paddingVertical: 4 },
  hallName: { fontFamily: F.regular, fontSize: 14, color: INK, flexShrink: 1 },
  tagline: { fontFamily: F.medium, fontSize: 9.5, letterSpacing: 2.2, color: INK, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: 'inset 0px 1.5px 0px rgba(255, 255, 255, 1), 0px 4px 12px rgba(31, 58, 112, 0.16)',
  },
  avatar: { backgroundColor: 'rgba(234, 242, 253, 0.9)' },
  avatarText: { fontFamily: F.regular, fontSize: 19, lineHeight: 24, color: '#1F4488' },
  dot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E0242E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
});
