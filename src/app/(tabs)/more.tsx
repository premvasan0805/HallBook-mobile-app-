import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactBrandHeader } from '@/components/brand-header';
import { ConfirmDialog } from '@/components/overlays';
import { Touchable } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { C, elevation, F } from '@/lib/theme';

const HALL_PHOTO = require('../../../assets/images/home/hall-stage.png');

type Item = { icon: ReactNode; title: string; sub: string; href: Href; tint: string };

const ITEMS: Item[] = [
  {
    icon: <MaterialCommunityIcons name="calendar-clock-outline" size={30} color={C.primary} />,
    title: 'Timings & Rates',
    sub: 'Booking timings and rates by date category',
    href: '/settings/pricing',
    tint: C.primarySoft,
  },
  {
    icon: <Ionicons name="star" size={25} color={C.accent} />,
    title: 'Important Dates',
    sub: 'Muhurtham, valarpirai and special dates',
    href: '/settings/dates',
    tint: C.accentSoft,
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { hall, setSignedIn } = useStore();
  const [focused, setFocused] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Light status bar only while this tab (with its burgundy header) is on screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  return (
    <View style={st.screen}>
      {focused ? <StatusBar style="light" /> : null}
      {/* Header stays pinned; only the content below it scrolls. */}
      {/* The profile avatar links here, so it is hidden on this tab. */}
      <CompactBrandHeader topInset={insets.top} showProfile={false} />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

        <View style={st.body}>
          <Text style={st.title}>Settings</Text>
          <Text style={st.subtitle}>Manage your hall details and preferences</Text>

          <Touchable
            onPress={() => router.push('/settings/hall')}
            accessibilityRole="button"
            accessibilityLabel={`Hall details, ${hall.name}`}
            style={[st.card, st.hallCard]}>
            <Image source={HALL_PHOTO} style={st.hallPhoto} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={st.overline}>Hall</Text>
              <Text style={st.hallName} numberOfLines={1}>
                {hall.name}
              </Text>
              <Text style={st.hallSub} numberOfLines={1}>
                {hall.org} · {hall.role}
              </Text>
            </View>
            <Chevron tint={C.primarySoft} />
          </Touchable>

          {ITEMS.map((it) => (
            <Touchable
              key={it.title}
              onPress={() => router.push(it.href)}
              accessibilityRole="button"
              style={[st.card, st.row]}>
              <View style={[st.iconBox, { backgroundColor: it.tint }]}>{it.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={st.rowTitle}>{it.title}</Text>
                <Text style={st.rowSub} numberOfLines={1}>
                  {it.sub}
                </Text>
              </View>
              <Chevron tint={it.tint} />
            </Touchable>
          ))}

          <Touchable onPress={() => setConfirm(true)} accessibilityRole="button" style={st.signOut}>
            <Ionicons name="log-out-outline" size={22} color={C.danger} />
            <Text style={st.signOutText}>Sign out</Text>
          </Touchable>
        </View>
      </ScrollView>

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
    </View>
  );
}

function Chevron({ tint }: { tint: string }) {
  return (
    <View style={[st.chevron, { backgroundColor: tint }]}>
      <Ionicons name="chevron-forward" size={15} color={C.text} />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 120 },
  body: { paddingHorizontal: 18, paddingTop: 20, gap: 12 },
  title: { fontFamily: F.serifBold, fontSize: 36, lineHeight: 42, color: C.primary },
  subtitle: { fontFamily: F.regular, fontSize: 14.5, lineHeight: 20, color: C.textSecondary, marginBottom: 6 },
  card: { backgroundColor: C.surface, borderRadius: 14, ...elevation },
  hallCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 12 },
  hallPhoto: { width: 118, height: 72, borderRadius: 8 },
  overline: {
    fontFamily: F.semibold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.9,
    color: C.textSecondary,
    textTransform: 'uppercase',
  },
  hallName: { fontFamily: F.serifBold, fontSize: 21, lineHeight: 26, color: C.text },
  hallSub: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 11, paddingRight: 12 },
  iconBox: { width: 49, height: 49, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: F.semibold, fontSize: 15, lineHeight: 21, color: C.text },
  rowSub: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: C.textSecondary },
  chevron: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 44,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#D9586A',
    backgroundColor: '#FDF1F3',
  },
  signOutText: { fontFamily: F.semibold, fontSize: 15, color: C.danger },
});
