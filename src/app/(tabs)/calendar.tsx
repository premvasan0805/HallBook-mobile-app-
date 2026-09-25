import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhotoBrandHeader } from '@/components/brand-header';
import { openBooking } from '@/components/cards';
import { CalendarBoard, DayDetail } from '@/components/calendar-board';
import { currentYM, type YM } from '@/components/calendar';
import { BrandGradient, Lotus } from '@/components/decor';
import { ConfirmDialog, useToast } from '@/components/overlays';
import { Touchable } from '@/components/primitives';
import { fmtFull, parseISO, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { C, elevation, F } from '@/lib/theme';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const [ym, setYm] = useState<YM>(currentYM());
  const [selected, setSelected] = useState<string>(todayISO());

  // Light status bar only while this tab (with its burgundy header) is on screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const goToday = () => {
    setYm(currentYM());
    setSelected(todayISO());
  };

  return (
    <View style={st.screen}>
      {focused ? <StatusBar style="light" /> : null}
      {/* Header stays pinned; only the content below it scrolls. */}
      <PhotoBrandHeader topInset={insets.top} />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={st.card}>
          <View style={st.titleRow}>
            <View>
              <Text style={st.title}>Calendar</Text>
              <Text style={st.subtitle}>Plan • Book • Celebrate</Text>
            </View>
            <View style={st.flourish} pointerEvents="none">
              <View style={st.flourishLine} />
              <View style={st.flourishDot} />
              <Lotus size={30} color={C.accent} />
              <View style={st.flourishDot} />
              <View style={st.flourishLine} />
            </View>
            <Touchable
              onPress={goToday}
              accessibilityRole="button"
              accessibilityLabel="Go to today"
              hitSlop={8}
              style={st.todayBtn}>
              <MaterialCommunityIcons name="calendar-check-outline" size={17} color={C.primary} />
              <Text style={st.todayText}>Today</Text>
            </Touchable>
          </View>
          <CalendarBoard
            ym={ym}
            onChangeYm={setYm}
            selected={selected}
            onSelect={(iso) => {
              setSelected(iso);
              const d = parseISO(iso);
              if (d.getMonth() !== ym.m || d.getFullYear() !== ym.y) setYm({ y: d.getFullYear(), m: d.getMonth() });
            }}
          />

          <Animated.View key={selected} entering={FadeIn.duration(180)} style={st.dayBlock}>
            <DayDetail
              iso={selected}
              onBook={(slot) => router.push({ pathname: '/booking/new', params: { date: selected, slot } })}
              onOpenBooking={(b) => openBooking(b.id)}
            />
            <DayActions iso={selected} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Burgundy used for the Block Date outline, icon and label. */
const BLOCK_FG = '#7A1432';

function DayActions({ iso }: { iso: string }) {
  const { bookingsOn, segmentState, blockedDays, toggleBlock } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const list = bookingsOn(iso);
  const blocked = blockedDays.includes(iso);
  const anyFree = Object.values(segmentState(iso)).some((s) => s === 'free');
  // Same 1392px-wide reference as the day card above, so both scale together.
  const [rowWidth, setRowWidth] = useState(0);
  const u = (px: number) => (rowWidth / 1392) * px;
  const btn = { height: u(138), borderRadius: u(22) };
  const label = { fontSize: u(62), lineHeight: u(74) };

  return (
    <>
      <View style={[st.actions, { gap: u(24) }]} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
        <Touchable
          onPress={() => router.push({ pathname: '/booking/new', params: { date: iso } })}
          disabled={blocked || !anyFree}
          accessibilityRole="button"
          hitSlop={6}
          style={[st.actionBtn, st.addBtn, btn, { gap: u(48) }]}>
          <BrandGradient id="addBookingGrad" from="#9A2244" to="#6A0B2D" />
          <Ionicons name="add" size={u(84)} color={C.onPrimary} />
          <Text style={[st.actionText, label, { color: C.onPrimary }]}>Add Booking</Text>
        </Touchable>
        <Touchable
          onPress={() => (blocked ? (toggleBlock(iso), toast('Date unblocked')) : setConfirm(true))}
          accessibilityRole="button"
          hitSlop={6}
          style={[st.actionBtn, st.blockBtn, btn, { gap: u(46) }]}>
          <Ionicons name={blocked ? 'lock-open-outline' : 'lock-closed-outline'} size={u(68)} color={BLOCK_FG} />
          <Text style={[st.actionText, label, { color: BLOCK_FG }]}>{blocked ? 'Unblock' : 'Block Date'}</Text>
        </Touchable>
      </View>

      <ConfirmDialog
        visible={confirm}
        title="Block this date?"
        message={
          list.length > 0
            ? `${fmtFull(iso)} will be unavailable for new bookings. Its ${list.length} existing booking${list.length > 1 ? 's stay' : ' stays'} as is.`
            : `${fmtFull(iso)} will be unavailable for new bookings.`
        }
        confirmLabel="Block date"
        onConfirm={() => {
          toggleBlock(iso);
          setConfirm(false);
          toast('Date blocked');
        }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 14, paddingBottom: 24 },

  /** Title, month board, selected day and actions, laid straight on the page. */
  card: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 4, paddingRight: 0 },
  title: { fontFamily: F.serifBold, fontSize: 33, lineHeight: 36, color: C.primary },
  subtitle: { fontFamily: F.regular, fontSize: 10.5, letterSpacing: 1.4, color: C.textSecondary, marginTop: -1 },
  flourish: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 6 },
  flourishLine: { flex: 1, maxWidth: 30, height: 1, backgroundColor: C.accent },
  flourishDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.accent },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#EFE7E0',
    ...elevation,
  },
  todayText: { fontFamily: F.semibold, fontSize: 12.5, color: C.primary },

  dayBlock: { gap: 6, marginTop: 12 },
  actions: { flexDirection: 'row' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addBtn: { flex: 821, boxShadow: '0px 3px 8px rgba(87, 21, 44, 0.25)' },
  blockBtn: { flex: 547, backgroundColor: C.surface, borderWidth: 1.5, borderColor: '#8E1535' },
  actionText: { fontFamily: F.pageSerifBold },
});
