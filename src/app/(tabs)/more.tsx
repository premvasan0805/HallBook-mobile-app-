import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlossTile, glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassBrandHeader } from '@/components/glass-header';
import { ConfirmDialog } from '@/components/overlays';
import { Screen, Touchable } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { F, type Theme } from '@/lib/theme';
import { makeStyles, useTheme, useThemeMode, type ThemeMode } from '@/lib/theme-context';

const HALL_PHOTO = require('../../../assets/images/home/hall-stage.png');

type Tone = { from: string; to: string };

type Item = { icon: ReactNode; title: string; sub: string; href: Href; tone: Tone };

const items = (t: Theme): Item[] => [
  {
    icon: <MaterialCommunityIcons name="calendar-clock-outline" size={28} color={t.tone.blue.fg} />,
    title: 'Timings & Rates',
    sub: 'Booking timings and rates by date category',
    href: '/settings/pricing',
    tone: t.tone.blue,
  },
  {
    icon: <Ionicons name="star" size={24} color={t.tone.sand.fg} />,
    title: 'Important Dates',
    sub: 'Muhurtham, valarpirai and special dates',
    href: '/settings/dates',
    tone: t.tone.sand,
  },
];

const APPEARANCE: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const { hall, setSignedIn } = useStore();
  const [confirm, setConfirm] = useState(false);
  const t = useTheme();
  const st = useSt();

  return (
    <>
      <Screen
        tab
        // The profile avatar links here, so it is hidden on this tab.
        header={<GlassBrandHeader tagline="Celebrate Beautiful Beginnings" hallIcon="bank" showProfile={false} />}
        backdrop={<GlassBackdrop />}
        contentStyle={st.content}>
        {/* Title card */}
        <View style={[st.titleCard, glassSurface(t, t.frost(0.5), 20)]}>
          <Sheen radius={20} strength={0.5} />
          <Text style={st.title}>Settings</Text>
          <Text style={st.subtitle}>Manage your hall details and preferences</Text>
        </View>

        <Touchable
          onPress={() => router.push('/settings/hall')}
          accessibilityRole="button"
          accessibilityLabel={`Hall details, ${hall.name}`}
          style={[st.row, st.hallCard, glassSurface(t, t.frost(0.58), 20)]}>
          <Sheen radius={20} strength={0.5} />
          <View style={st.photoFrame}>
            <Image source={HALL_PHOTO} style={st.hallPhoto} contentFit="cover" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.overline}>Hall</Text>
            <Text style={st.hallName} numberOfLines={1}>
              {hall.name}
            </Text>
            <Text style={st.rowSub} numberOfLines={1}>
              {hall.org} · {hall.role}
            </Text>
          </View>
          <Chevron tone={t.tone.blue} />
        </Touchable>

        {items(t).map((it) => (
          <Touchable
            key={it.title}
            onPress={() => router.push(it.href)}
            accessibilityRole="button"
            style={[st.row, glassSurface(t, t.frost(0.58), 20)]}>
            <Sheen radius={20} strength={0.5} />
            <GlossTile from={it.tone.from} to={it.tone.to} radius={16} style={st.iconBox}>
              {it.icon}
            </GlossTile>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.rowTitle}>{it.title}</Text>
              <Text style={st.rowSub} numberOfLines={1}>
                {it.sub}
              </Text>
            </View>
            <Chevron tone={it.tone} />
          </Touchable>
        ))}

        <Appearance />

        <Touchable
          onPress={() => setConfirm(true)}
          accessibilityRole="button"
          style={[st.signOut, glassSurface(t, t.tint(0.72), 16)]}>
          <Ionicons name="log-out-outline" size={22} color={t.G.navy} />
          <Text style={st.signOutText}>Sign out</Text>
        </Touchable>
      </Screen>

      <ConfirmDialog
        visible={confirm}
        destructive
        title="Sign out?"
        message="You'll need to sign in again to manage bookings."
        confirmLabel="Sign out"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          setSignedIn(false);
          router.replace('/login');
        }}
      />
    </>
  );
}

function Chevron({ tone }: { tone: Tone }) {
  const t = useTheme();
  const st = useSt();
  return (
    <GlossTile from={tone.from} to={tone.to} radius={16} style={st.chevron}>
      <Ionicons name="chevron-forward" size={16} color={t.G.navy} />
    </GlossTile>
  );
}

/** Light / Dark / System choice, saved on the device. */
function Appearance() {
  const t = useTheme();
  const st = useSt();
  const { mode, setMode } = useThemeMode();
  return (
    <View style={[st.appearance, glassSurface(t, t.frost(0.58), 20)]}>
      <Sheen radius={20} strength={0.5} />
      <View style={st.appearanceHead}>
        <GlossTile from={t.tone.violet.from} to={t.tone.violet.to} radius={16} style={st.iconBox}>
          <Ionicons name="contrast-outline" size={24} color={t.tone.violet.fg} />
        </GlossTile>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.rowTitle}>Appearance</Text>
          <Text style={st.rowSub} numberOfLines={1}>
            Light, dark, or match your device
          </Text>
        </View>
      </View>
      <View accessibilityRole="radiogroup" style={st.segment}>
        {APPEARANCE.map((o) => {
          const on = mode === o.key;
          return (
            <Touchable
              key={o.key}
              onPress={() => setMode(o.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${o.label} appearance`}
              style={[st.option, on && glassSurface(t, t.frost(0.92), 12)]}>
              <Ionicons name={o.icon} size={16} color={on ? t.G.blue : t.G.muted} />
              <Text style={[st.optionText, on && st.optionTextOn]}>{o.label}</Text>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}

const useSt = makeStyles((t) => StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 0, gap: 10 },

  titleCard: { paddingVertical: 16, paddingHorizontal: 18 },
  title: { fontFamily: F.semibold, fontSize: 25, lineHeight: 30, letterSpacing: -0.3, color: t.G.ink },
  subtitle: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 17, color: t.G.muted, marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingRight: 12 },
  hallCard: { padding: 10 },
  photoFrame: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: t.glassBorder,
    overflow: 'hidden',
    boxShadow: t.dark ? '0px 4px 12px rgba(0, 0, 0, 0.35)' : '0px 4px 10px rgba(30, 30, 30, 0.10)',
  },
  hallPhoto: { width: 112, height: 72 },
  overline: { fontFamily: F.medium, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.8, color: t.G.muted, textTransform: 'uppercase' },
  hallName: { fontFamily: F.semibold, fontSize: 18, lineHeight: 23, letterSpacing: -0.2, color: t.G.ink },
  iconBox: { width: 52, height: 52 },
  rowTitle: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, color: t.G.ink },
  rowSub: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: t.G.muted },
  chevron: { width: 32, height: 32 },

  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, marginTop: 8 },
  signOutText: { fontFamily: F.semibold, fontSize: 14.5, color: t.G.navy },

  appearance: { padding: 12, gap: 12 },
  appearanceHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  segment: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: t.dark ? 'rgba(255, 255, 255, 0.04)' : t.tint(0.6),
  },
  option: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionText: { fontFamily: F.medium, fontSize: 13, color: t.G.muted },
  optionTextOn: { fontFamily: F.semibold, color: t.G.ink },
}));
