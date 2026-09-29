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
import { F } from '@/lib/theme';

const HALL_PHOTO = require('../../../assets/images/home/hall-stage.png');

/** Blue glass palette, shared with Home. */
const INK = '#131D38';
const NAVY = '#1F3A70';
const MUTED = '#5B6275';

type Tone = { from: string; to: string };
const BLUE: Tone = { from: '#F0F5FE', to: '#CFE0FA' };
const SAND: Tone = { from: '#FCF4E2', to: '#F0DFBA' };

type Item = { icon: ReactNode; title: string; sub: string; href: Href; tone: Tone };

const ITEMS: Item[] = [
  {
    icon: <MaterialCommunityIcons name="calendar-clock-outline" size={28} color="#1F4A9A" />,
    title: 'Timings & Rates',
    sub: 'Booking timings and rates by date category',
    href: '/settings/pricing',
    tone: BLUE,
  },
  {
    icon: <Ionicons name="star" size={24} color="#C58A1E" />,
    title: 'Important Dates',
    sub: 'Muhurtham, valarpirai and special dates',
    href: '/settings/dates',
    tone: SAND,
  },
];

export default function SettingsScreen() {
  const { hall, setSignedIn } = useStore();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <Screen
        tab
        // The profile avatar links here, so it is hidden on this tab.
        header={<GlassBrandHeader tagline="Celebrate Beautiful Beginnings" hallIcon="bank" showProfile={false} />}
        backdrop={<GlassBackdrop />}
        contentStyle={st.content}>
        {/* Title card */}
        <View style={[st.titleCard, glassSurface('rgba(255, 255, 255, 0.5)', 20)]}>
          <Sheen radius={20} strength={0.5} />
          <Text style={st.title}>Settings</Text>
          <Text style={st.subtitle}>Manage your hall details and preferences</Text>
        </View>

        <Touchable
          onPress={() => router.push('/settings/hall')}
          accessibilityRole="button"
          accessibilityLabel={`Hall details, ${hall.name}`}
          style={[st.row, st.hallCard, glassSurface('rgba(255, 255, 255, 0.58)', 20)]}>
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
          <Chevron tone={BLUE} />
        </Touchable>

        {ITEMS.map((it) => (
          <Touchable
            key={it.title}
            onPress={() => router.push(it.href)}
            accessibilityRole="button"
            style={[st.row, glassSurface('rgba(255, 255, 255, 0.58)', 20)]}>
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

        <Touchable
          onPress={() => setConfirm(true)}
          accessibilityRole="button"
          style={[st.signOut, glassSurface('rgba(226, 236, 252, 0.72)', 16)]}>
          <Ionicons name="log-out-outline" size={22} color={NAVY} />
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
  return (
    <GlossTile from={tone.from} to={tone.to} radius={16} style={st.chevron}>
      <Ionicons name="chevron-forward" size={16} color={NAVY} />
    </GlossTile>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 0, gap: 10 },

  titleCard: { paddingVertical: 16, paddingHorizontal: 18 },
  title: { fontFamily: F.serifBold, fontSize: 38, lineHeight: 42, color: INK },
  subtitle: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: MUTED, marginTop: 1 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingRight: 12 },
  hallCard: { padding: 10 },
  photoFrame: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
    boxShadow: '0px 4px 10px rgba(31, 58, 112, 0.14)',
  },
  hallPhoto: { width: 112, height: 72 },
  overline: { fontFamily: F.semibold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase' },
  hallName: { fontFamily: F.serifBold, fontSize: 22, lineHeight: 27, color: INK },
  iconBox: { width: 52, height: 52 },
  rowTitle: { fontFamily: F.semibold, fontSize: 15.5, lineHeight: 21, color: INK },
  rowSub: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: MUTED },
  chevron: { width: 32, height: 32 },

  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, marginTop: 8 },
  signOutText: { fontFamily: F.semibold, fontSize: 15, color: NAVY },
});
