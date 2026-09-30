import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { glassSurface, GradientFill, Sheen } from '@/components/glass';
import { goBack, Touchable } from '@/components/primitives';
import { initials, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

export { GLASS_BACKDROP, GlassBackdrop } from '@/components/glass';

/**
 * Blue glass header for the Bookings, Customers and Settings tabs: navy/blue "Banyan Meadows" wordmark and hall
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
  const t = useTheme();
  const st = useSt();

  return (
    <View style={st.wrap}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.wordmark} numberOfLines={1}>
          Banyan <Text style={{ color: t.G.blue }}>Meadows</Text>
        </Text>
        <Touchable
          onPress={() => router.push('/settings/hall')}
          accessibilityLabel="Hall details"
          style={st.hallRow}>
          <MaterialCommunityIcons name={hallIcon} size={22} color={t.G.navy} />
          <Text numberOfLines={1} style={st.hallName}>
            {hall.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color={t.G.ink} />
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
          <Ionicons name="notifications-outline" size={20} color={t.G.ink} />
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

/** Glass settings-page header: frosted back orb, two-tone title and the hall switcher under it. */
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
  const t = useTheme();
  const st = useSt();
  return (
    <View style={[st.page, { paddingTop: insets.top + 14 }]}>
      <Touchable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={[st.back, glassSurface(t, t.frost(0.55), 18)]}>
        <Sheen radius={18} strength={0.6} />
        <Ionicons name="arrow-back" size={18} color={t.G.navy} />
      </Touchable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.pageTitle} numberOfLines={1}>
          {lead} <Text style={{ color: t.G.blue }}>{accent}</Text>
        </Text>
        <Touchable onPress={() => router.push('/settings/hall')} accessibilityLabel="Hall details" style={st.pageHall}>
          {hallIcon ? <MaterialCommunityIcons name={hallIcon} size={15} color={t.G.navy} /> : null}
          <Text style={st.pageHallName} numberOfLines={1}>
            {hall.name}
          </Text>
          <Ionicons name="chevron-down" size={12} color={t.G.ink} />
        </Touchable>
      </View>
    </View>
  );
}

/** Soft blue call-to-action pinned under a glass page, with a thin light rim, soft shadow and faint light trails. */
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
  const t = useTheme();
  const st = useSt();
  const trail = t.dark ? 0.5 : 0.8;
  return (
    <View style={[st.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
      <Touchable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[st.cta, disabled && { opacity: 0.6 }]}>
        <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={11} fromOpacity={0.8} toOpacity={0.68} />
        <Sheen radius={11} strength={0.35} height="50%" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 11, overflow: 'hidden' }]}>
          <Svg width="100%" height="100%" viewBox="0 0 400 50" preserveAspectRatio="none">
            <Path d="M20 50C70 30 110 12 170 0" stroke={t.highlight} strokeOpacity={0.28 * trail} strokeWidth={1} fill="none" />
            <Path d="M40 50C85 34 125 16 190 0" stroke={t.highlight} strokeOpacity={0.14 * trail} strokeWidth={1} fill="none" />
            <Path d="M300 50C335 32 365 14 400 6" stroke={t.highlight} strokeOpacity={0.3 * trail} strokeWidth={1} fill="none" />
            <Path d="M330 50C360 36 380 24 400 18" stroke={t.highlight} strokeOpacity={0.18 * trail} strokeWidth={1} fill="none" />
          </Svg>
        </View>
        {icon}
        <Text style={st.ctaText}>{title}</Text>
      </Touchable>
    </View>
  );
}

const ORB = 40;

const useSt = makeStyles((t) =>
  StyleSheet.create({
    page: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18 },
    back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { fontFamily: F.semibold, fontSize: 24, lineHeight: 31, letterSpacing: -0.4, color: t.G.ink },
    pageHall: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 1 },
    pageHallName: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: t.G.ink, flexShrink: 1 },
    ctaWrap: { paddingHorizontal: 18, paddingTop: 8 },
    cta: {
      height: 46,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
    },
    ctaText: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, letterSpacing: 0.1, color: t.G.onBlue },
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingLeft: 26,
      paddingRight: 16,
      paddingTop: 14,
      paddingBottom: 18,
      zIndex: 1,
    },
    wordmark: { fontFamily: F.semibold, fontSize: 26, lineHeight: 50, color: t.G.ink, letterSpacing: -0.5 },
    hallRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2, alignSelf: 'flex-start', paddingVertical: 4 },
    hallName: { fontFamily: F.medium, fontSize: 14, lineHeight: 19, color: t.G.ink, flexShrink: 1 },
    tagline: { fontFamily: F.medium, fontSize: 9.5, lineHeight: 13, letterSpacing: 1.4, color: t.G.ink, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
    orb: {
      width: ORB,
      height: ORB,
      borderRadius: ORB / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.frost(0.72),
      borderWidth: 1.5,
      borderColor: t.glassBorder,
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 8px 20px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 4px 12px rgba(30, 30, 30, 0.08)',
    },
    avatar: { backgroundColor: t.tint(0.9) },
    avatarText: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, letterSpacing: 0.2, color: t.G.navy },
    dot: {
      position: 'absolute',
      top: 7,
      right: 8,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: t.C.danger,
      borderWidth: 1.5,
      borderColor: t.dark ? t.C.surface : 'rgba(255, 255, 255, 0.95)',
    },
  }),
);
