import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { openBooking } from '@/components/cards';
import { CalendarBoard, DayDetail } from '@/components/calendar-board';
import { currentYM, type YM } from '@/components/calendar';
import { GradientFill, glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassBrandHeader } from '@/components/glass-header';
import { ConfirmDialog, useToast } from '@/components/overlays';
import { Screen, Touchable } from '@/components/primitives';
import { fmtFull, parseISO, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { F } from '@/lib/theme';

/** Blue glass palette, shared with Home. */
const INK = '#131D38';
const BLUE_DEEP = '#173F8E';
const BLUE_BRIGHT = '#3368C4';

export default function CalendarScreen() {
  const [ym, setYm] = useState<YM>(currentYM());
  const [selected, setSelected] = useState<string>(todayISO());

  const goToday = () => {
    setYm(currentYM());
    setSelected(todayISO());
  };

  return (
    <Screen
      tab
      header={<GlassBrandHeader tagline="Celebrate Beautiful Beginnings" hallIcon="bank" />}
      backdrop={<GlassBackdrop />}
      contentStyle={st.content}>
      <View style={st.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Calendar</Text>
          <Text style={st.subtitle}>Plan • Book • Celebrate</Text>
        </View>
        <Touchable
          onPress={goToday}
          accessibilityRole="button"
          accessibilityLabel="Go to today"
          hitSlop={8}
          style={[st.todayBtn, glassSurface('rgba(255, 255, 255, 0.66)', 16)]}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={19} color={BLUE_DEEP} />
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
    </Screen>
  );
}

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
  const radius = u(34);
  const btn = { height: u(150), borderRadius: radius };
  const label = { fontSize: u(62), lineHeight: u(74) };

  return (
    <>
      <View style={[st.actions, { gap: u(30) }]} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
        <Touchable
          onPress={() => router.push({ pathname: '/booking/new', params: { date: iso } })}
          disabled={blocked || !anyFree}
          accessibilityRole="button"
          hitSlop={6}
          style={[st.actionBtn, st.addBtn, btn, { gap: u(48) }]}>
          <GradientFill from={BLUE_BRIGHT} to={BLUE_DEEP} radius={radius} horizontal />
          <Sheen radius={radius} strength={0.3} height="50%" />
          <Ionicons name="add" size={u(84)} color="#FFFFFF" />
          <Text style={[st.actionText, label, { color: '#FFFFFF' }]}>Add Booking</Text>
        </Touchable>
        <Touchable
          onPress={() => (blocked ? (toggleBlock(iso), toast('Date unblocked')) : setConfirm(true))}
          accessibilityRole="button"
          hitSlop={6}
          style={[st.actionBtn, glassSurface('rgba(255, 255, 255, 0.6)', radius), st.blockBtn, btn, { gap: u(46) }]}>
          <Ionicons name={blocked ? 'lock-open-outline' : 'lock-closed-outline'} size={u(68)} color={BLUE_DEEP} />
          <Text style={[st.actionText, label, { color: BLUE_DEEP }]}>{blocked ? 'Unblock' : 'Block Date'}</Text>
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
  content: { paddingHorizontal: 12, paddingTop: 0, gap: 0 },

  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12, paddingLeft: 6 },
  title: { fontFamily: F.serifBold, fontSize: 40, lineHeight: 44, color: INK },
  subtitle: { fontFamily: F.medium, fontSize: 11, letterSpacing: 2.6, color: INK, marginTop: 1 },
  todayBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 16 },
  todayText: { fontFamily: F.pageSerifBold, fontSize: 15, color: BLUE_DEEP },

  dayBlock: { gap: 10, marginTop: 12 },
  actions: { flexDirection: 'row' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  addBtn: {
    flex: 821,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    boxShadow: 'inset 0px 1.5px 0px rgba(255, 255, 255, 0.4), 0px 8px 18px rgba(23, 63, 142, 0.32)',
  },
  blockBtn: { flex: 547, borderColor: 'rgba(38, 78, 160, 0.75)' },
  actionText: { fontFamily: F.pageSerifBold },
});
