import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { openBooking } from '@/components/cards';
import { currentYM, shiftMonth } from '@/components/calendar';
import { BrandGradient, Mandala } from '@/components/decor';
import { HomeHero } from '@/components/home-hero';
import { EmptyState, Screen, Touchable, type IconName } from '@/components/primitives';
import { fmtClock, fmtLong, greeting, initials, inr, inrShort, MONTHS, parseISO, todayISO } from '@/lib/format';
import { balanceOf, payState, SLOT_LABEL, useStore, type Booking, type Segment } from '@/lib/store';
import { appWidth, C, elevation, F } from '@/lib/theme';

/** Home is laid out on the 903px-wide design reference; `u(px)` converts a reference pixel to dp. */
const REF_WIDTH = 903;
/** Side padding of the page content, in reference px. */
const PAD = 32;

type Trend = { text: string; dir: 'up' | 'down' | 'flat' };

function pctTrend(cur: number, prev: number): Trend {
  if (prev === 0) return cur > 0 ? { text: 'New this month', dir: 'up' } : { text: 'No change this month', dir: 'flat' };
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return { text: 'No change this month', dir: 'flat' };
  return { text: `${pct > 0 ? '+' : ''}${pct}% this month`, dir: pct > 0 ? 'up' : 'down' };
}

function countTrend(cur: number, prev: number): Trend {
  const d = cur - prev;
  if (d === 0) return { text: 'No change this month', dir: 'flat' };
  return { text: `${d > 0 ? '+' : ''}${d} this month`, dir: d > 0 ? 'up' : 'down' };
}

function timeLabel(b: Booking, segs: Segment[]) {
  if (b.slot === 'full') return 'All Day';
  const key = b.slot === 'first' ? 'late' : b.slot === 'second' ? 'evening' : 'early';
  const s = segs.find((x) => x.key === key);
  return s ? `${fmtClock(s.start)} - ${fmtClock(s.end)}` : SLOT_LABEL[b.slot];
}

export default function HomeScreen() {
  const { hall, bookings, monthSummary, customerById, segments } = useStore();
  const { width } = useWindowDimensions();
  const u = (px: number) => (appWidth(width) / REF_WIDTH) * px;
  /** Font size from the reference, never below 11dp so small print stays readable. */
  const fs = (px: number) => Math.max(u(px), 11);

  const today = todayISO();
  const ym = currentYM();
  const prevYm = shiftMonth(ym, -1);
  const sum = monthSummary(ym.y, ym.m);
  const prev = monthSummary(prevYm.y, prevYm.m);

  const active = bookings.filter((b) => b.status !== 'cancelled');
  const todays = active.filter((b) => b.date === today);
  const upcoming = active.filter((b) => b.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const next = todays[0] ?? upcoming[0];

  const stats: { icon: IconName; value: string; label: string; tint: { fg: string; bg: string }; trend: Trend; onPress?: () => void }[] = [
    {
      icon: 'bar-chart',
      value: inrShort(sum.revenue),
      label: 'Revenue',
      tint: { fg: C.primary, bg: C.primarySoft },
      trend: pctTrend(sum.revenue, prev.revenue),
    },
    {
      icon: 'wallet',
      value: inrShort(sum.received),
      label: 'Received',
      tint: { fg: C.success, bg: C.successSoft },
      trend: pctTrend(sum.received, prev.received),
    },
    {
      icon: 'time-outline',
      value: inrShort(sum.due),
      label: 'Due',
      tint: { fg: C.accentText, bg: C.accentSoft },
      trend: pctTrend(sum.due, prev.due),
      onPress: () => router.push({ pathname: '/bookings', params: { filter: 'unpaid' } }),
    },
    {
      icon: 'people-outline',
      value: String(sum.count),
      label: 'Total Bookings',
      tint: { fg: C.primary, bg: C.primarySoft },
      trend: countTrend(sum.count, prev.count),
      onPress: () => router.push('/calendar'),
    },
  ];

  const openHero = () => (next ? openBooking(next.id) : router.push('/calendar'));

  // Greeting, tagline, venue photo and today's bookings — pinned above the scroll view so only the cards below scroll.
  const header = (
    <HomeHero
      greeting={greeting()}
      name={hall.role}
      hallName={hall.name}
      initials={initials(hall.role)}
      hasAlerts={upcoming.length > 0}
      count={todays.length}
      title={todays.length > 0 ? `${todays[0].eventType} · ${SLOT_LABEL[todays[0].slot]}` : 'No events today'}
      subtitle={
        todays.length > 0
          ? `${customerById(todays[0].customerId)?.name ?? ''} · ${fmtLong(today)}`
          : next
            ? `Next: ${customerById(next.customerId)?.name ?? ''} · ${fmtLong(next.date)}`
            : fmtLong(today)
      }
      onOpen={openHero}
      onHall={() => router.push('/settings/hall')}
      onAlerts={() => router.push('/settings/notifications')}
      onProfile={() => router.push('/more')}
    />
  );

  return (
    <Screen
      tab
      header={header}
      onRefresh={() => new Promise((r) => setTimeout(r, 500))}
      contentStyle={{ paddingHorizontal: u(PAD), paddingTop: 0, gap: 0, flexGrow: 1 }}>
      {/* ---------- This month ---------- */}
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: u(16), rowGap: u(14), marginTop: u(22) }}
        accessibilityLabel={`${MONTHS[ym.m]} overview`}>
        {stats.map((s) => (
          <Touchable
            key={s.label}
            onPress={s.onPress}
            accessibilityRole={s.onPress ? 'button' : 'summary'}
            style={[
              st.card,
              {
                width: (appWidth(width) - u(PAD) * 2 - u(16)) / 2,
                height: u(176),
                borderRadius: u(22),
                paddingLeft: u(30),
                gap: u(26),
              },
            ]}>
            <View
              style={{
                width: u(93),
                height: u(93),
                borderRadius: u(22),
                backgroundColor: s.tint.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={s.icon} size={u(44)} color={s.tint.fg} />
            </View>
            <MiniBars color={s.tint.fg} u={u} />
            <View style={{ flex: 1, paddingRight: u(12) }}>
              <Text
                style={{ fontFamily: F.bold, fontSize: u(34), lineHeight: u(42), color: C.text }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {s.value}
              </Text>
              <Text style={{ fontFamily: F.regular, fontSize: fs(23), color: C.textSecondary, marginTop: u(2) }} numberOfLines={1}>
                {s.label}
              </Text>
              <TrendLine trend={s.trend} u={u} fs={fs} />
            </View>
          </Touchable>
        ))}
      </View>

      {/* ---------- Upcoming events ---------- */}
      <View style={[st.sectionRow, { marginTop: u(36), marginBottom: u(20) }]}>
        <Text style={{ fontFamily: F.serifBold, fontSize: u(42), lineHeight: u(50), color: C.text }}>Upcoming Events</Text>
        {upcoming.length ? (
          <Touchable
            onPress={() => router.push({ pathname: '/bookings', params: { filter: 'upcoming' } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: u(6), paddingVertical: u(8) }}>
            <Text style={{ fontFamily: F.semibold, fontSize: u(24), color: C.primary }}>See all</Text>
            <Ionicons name="arrow-forward" size={u(24)} color={C.primary} />
          </Touchable>
        ) : null}
      </View>
      {upcoming.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="New bookings will appear here." />
      ) : (
        <View style={{ gap: 10 }}>
          {upcoming.slice(0, 5).map((b) => (
            <EventRow
              key={b.id}
              booking={b}
              name={customerById(b.customerId)?.name ?? 'Unknown customer'}
              time={timeLabel(b, segments)}
              hall={hall.name}
              u={u}
              fs={fs}
            />
          ))}
        </View>
      )}

      {/* ---------- Add booking — pinned above the tab bar when content is shorter than the screen ---------- */}
      <View style={{ flexGrow: 1, minHeight: u(30) }} />
      <Touchable
        accessibilityRole="button"
        onPress={() => router.push('/booking/new')}
        style={[st.cta, { height: u(103), borderRadius: u(24), gap: u(22) }]}>
        <BrandGradient id="ctaGrad" from={C.gradientFrom} to={C.gradientTo} />
        <View style={{ position: 'absolute', left: u(610), top: u(-10)  }} pointerEvents="none">
          <Mandala size={u(170)} color={C.accentOnPrimary} opacity={0.2} />
        </View>
        <Ionicons name="add" size={u(46)} color={C.onPrimary} />
        <Text style={{ fontFamily: F.serifBold, fontSize: u(38), color: C.onPrimary }}>Add Booking</Text>
      </Touchable>
    </Screen>
  );
}

/** Three faint ascending bars tucked into a stat card's right side. */
function MiniBars({ color, u }: { color: string; u: (n: number) => number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', right: u(28), top: u(54), flexDirection: 'row', alignItems: 'flex-end', gap: u(6), opacity: 0.22 }}>
      {[26, 40, 56].map((h) => (
        <View key={h} style={{ width: u(14), height: u(h), borderRadius: u(5), backgroundColor: color }} />
      ))}
    </View>
  );
}

function TrendLine({ trend, u, fs }: { trend: Trend; u: (n: number) => number; fs: (n: number) => number }) {
  const color = trend.dir === 'up' ? C.success : trend.dir === 'down' ? C.danger : C.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(6), marginTop: u(8) }}>
      {trend.dir !== 'flat' ? (
        <Ionicons name={trend.dir === 'up' ? 'arrow-up' : 'arrow-down'} size={fs(20)} color={color} />
      ) : null}
      <Text style={{ fontFamily: F.regular, fontSize: fs(19), color, flexShrink: 1 }} numberOfLines={1}>
        {trend.text}
      </Text>
    </View>
  );
}

function EventRow({
  booking,
  name,
  time,
  hall,
  u,
  fs,
}: {
  booking: Booking;
  name: string;
  time: string;
  hall: string;
  u: (n: number) => number;
  fs: (n: number) => number;
}) {
  const d = parseISO(booking.date);
  const marriage = booking.eventType === 'Wedding' || booking.eventType === 'Reception';
  const block = marriage ? { bg: C.primarySoft, fg: C.primary } : { bg: C.accentSoft, fg: C.accentText };
  const pay = payState(booking);
  const badge =
    pay === 'paid'
      ? { label: 'PAID', bg: C.successSoft, fg: C.success }
      : pay === 'due'
        ? { label: `DUE ${inr(balanceOf(booking))}`, bg: C.accentSoft, fg: C.accentText }
        : { label: 'UNPAID', bg: C.primaryTint, fg: C.primary };

  return (
    <Touchable
      onPress={() => openBooking(booking.id)}
      accessibilityLabel={`${name}, ${booking.eventType}, ${inr(booking.total)}, ${badge.label}`}
      style={[st.card, { minHeight: u(164), borderRadius: u(22), paddingLeft: u(28), paddingRight: u(24), gap: u(26) }]}>
      <View
        style={{
          width: u(98),
          height: u(106),
          borderRadius: u(18),
          backgroundColor: block.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontFamily: F.serifBold, fontSize: u(46), lineHeight: u(50), color: block.fg, fontVariant: ['lining-nums'] }}>
          {String(d.getDate()).padStart(2, '0')}
        </Text>
        <Text style={{ fontFamily: F.medium, fontSize: fs(22), color: block.fg, letterSpacing: 0.5 }}>
          {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, paddingVertical: u(24) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10) }}>
          <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: u(27), lineHeight: u(36), color: C.text }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ fontFamily: F.bold, fontSize: u(27), lineHeight: u(36), color: C.text }}>
            {inr(booking.total)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10), marginTop: u(2) }}>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: fs(23), color: C.textSecondary }} numberOfLines={1}>
            {booking.eventType} · {SLOT_LABEL[booking.slot]}
          </Text>
          <View style={{ backgroundColor: badge.bg, borderRadius: u(20), paddingHorizontal: u(18), paddingVertical: u(6) }}>
            <Text style={{ fontFamily: F.bold, fontSize: fs(19), color: badge.fg, letterSpacing: 0.3 }}>{badge.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(10), gap: u(10) }}>
          <Ionicons name="time-outline" size={fs(22)} color={C.primary} />
          <Text style={[st.meta(fs), { flexShrink: 0 }]} numberOfLines={1}>
            {time}
          </Text>
          <Ionicons name="location" size={fs(22)} color={C.primary} style={{ marginLeft: u(18) }} />
          <Text style={[st.meta(fs), { flexShrink: 1 }]} numberOfLines={1}>
            {hall}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={u(28)} color={C.textMuted} />
    </Touchable>
  );
}

const st = {
  ...StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      ...elevation,
    },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  }),
  meta: (u: (n: number) => number) => ({ fontFamily: F.regular, fontSize: u(21), color: C.textSecondary }),
};
