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
import { makeStyles, useTheme } from '@/lib/theme-context';

export default function CalendarScreen() {
  const t = useTheme();
  const st = useSt();
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
          style={[st.todayBtn, glassSurface(t, t.frost(0.66), 16)]}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={19} color={t.G.deep} />
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
  const t = useTheme();
  const st = useSt();
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
  const label = { fontSize: u(52), lineHeight: u(64), letterSpacing: u(0.5) };

  return (
    <>
      <View style={[st.actions, { gap: u(30) }]} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
        <Touchable
          onPress={() => router.push({ pathname: '/booking/new', params: { date: iso } })}
          disabled={blocked || !anyFree}
          accessibilityRole="button"
          hitSlop={6}
          style={[st.actionBtn, st.addBtn, btn, { gap: u(48) }]}>
          <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={radius} horizontal />
          <Sheen radius={radius} strength={0.3} height="50%" />
          <Ionicons name="add" size={u(84)} color={t.G.onBlue} />
          <Text style={[st.actionText, label, { color: t.G.onBlue }]}>Add Booking</Text>
        </Touchable>
        <Touchable
          onPress={() => (blocked ? (toggleBlock(iso), toast('Date unblocked')) : setConfirm(true))}
          accessibilityRole="button"
          hitSlop={6}
          style={[st.actionBtn, glassSurface(t, t.frost(0.6), radius), st.blockBtn, btn, { gap: u(46) }]}>
          <Ionicons name={blocked ? 'lock-open-outline' : 'lock-closed-outline'} size={u(68)} color={t.G.deep} />
          <Text style={[st.actionText, label, { color: t.G.deep }]}>{blocked ? 'Unblock' : 'Block Date'}</Text>
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

const useSt = makeStyles((t) =>
  StyleSheet.create({
    content: { paddingHorizontal: 12, paddingTop: 0, gap: 0 },

    titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12, paddingLeft: 6 },
    title: { fontFamily: F.semibold, fontSize: 26, lineHeight: 31, letterSpacing: -0.4, color: t.G.ink },
    subtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, color: t.G.ink, marginTop: 1 },
    todayBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 16 },
    todayText: { fontFamily: F.semibold, fontSize: 14, color: t.G.deep },

    dayBlock: { gap: 10, marginTop: 12 },
    actions: { flexDirection: 'row' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    addBtn: {
      flex: 821,
      borderWidth: 1,
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
    },
    blockBtn: { flex: 547, borderColor: t.G.focusBorder },
    actionText: { fontFamily: F.semibold },
  }),
);
