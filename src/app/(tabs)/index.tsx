import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { openBooking } from '@/components/cards';
import { currentYM, shiftMonth } from '@/components/calendar';
import { GlossTile, glassTier, Sheen } from '@/components/glass';
import { GlassActionButton } from '@/components/glass-action';
import { HomeHero } from '@/components/home-hero';
import { EventRow } from '@/components/event-row';
import { EmptyState, Screen, Touchable, type IconName } from '@/components/primitives';
import { fmtLong, greeting, initials, inrShort, MONTHS, todayISO } from '@/lib/format';
import { SLOT_LABEL, useStore } from '@/lib/store';
import { appWidth, F, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/** Home is laid out on the 903px-wide design reference; `u(px)` converts a reference pixel to dp. */
const REF_WIDTH = 903;
/** Side padding of the page content, in reference px. */
const PAD = 32;

type Tint = { tile: [string, string]; fg: string; bars: string };
/** Muted semantic accents for the four stat cards (icon tile + bars only; the card itself is neutral glass). */
const tints = (t: Theme): Record<'gold' | 'mint' | 'amber' | 'lilac', Tint> => {
  const tint = ({ from, to, fg }: Theme['tone']['blue']): Tint => ({ tile: [from, to], fg, bars: `${fg}66` });
  return { gold: tint(t.tone.sand), mint: tint(t.tone.mint), amber: tint(t.tone.peach), lilac: tint(t.tone.violet) };
};

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

export default function HomeScreen() {
  const { hall, bookings, monthSummary, customerById } = useStore();
  const { width } = useWindowDimensions();
  const u = (px: number) => (appWidth(width) / REF_WIDTH) * px;
  /** Font size from the reference, never below 11dp so small print stays readable. */
  const fs = (px: number) => Math.max(u(px), 11);
  const t = useTheme();
  const st = useSt();
  const TINTS = tints(t);
  const INK = t.G.ink;
  const LINK = t.G.blue;

  const today = todayISO();
  const ym = currentYM();
  const prevYm = shiftMonth(ym, -1);
  const sum = monthSummary(ym.y, ym.m);
  const prev = monthSummary(prevYm.y, prevYm.m);

  const active = bookings.filter((b) => b.status !== 'cancelled');
  const todays = active.filter((b) => b.date === today);
  const upcoming = active.filter((b) => b.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const next = todays[0] ?? upcoming[0];

  const stats: { icon: IconName; value: string; label: string; tint: Tint; trend: Trend; onPress?: () => void }[] = [
    {
      icon: 'bar-chart',
      value: inrShort(sum.revenue),
      label: 'Revenue',
      tint: TINTS.gold,
      trend: pctTrend(sum.revenue, prev.revenue),
    },
    {
      icon: 'wallet',
      value: inrShort(sum.received),
      label: 'Received',
      tint: TINTS.mint,
      trend: pctTrend(sum.received, prev.received),
    },
    {
      icon: 'time-outline',
      value: inrShort(sum.due),
      label: 'Due',
      tint: TINTS.amber,
      trend: pctTrend(sum.due, prev.due),
      onPress: () => router.push({ pathname: '/bookings', params: { filter: 'unpaid' } }),
    },
    {
      icon: 'people-outline',
      value: String(sum.count),
      label: 'Total Bookings',
      tint: TINTS.lilac,
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
            ? `Next: ${customerById(next.customerId)?.name ?? ''} - ${fmtLong(next.date)}`
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
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: u(16), rowGap: u(20), marginTop: u(22) }}
        accessibilityLabel={`${MONTHS[ym.m]} overview`}>
        {stats.map((s) => (
          <Touchable
            key={s.label}
            onPress={s.onPress}
            accessibilityRole={s.onPress ? 'button' : 'summary'}
            style={[
              st.card,
              glassTier(t, 'secondary', u(26)),
              {
                width: (appWidth(width) - u(PAD) * 2 - u(16)) / 2,
                height: u(176),
                paddingLeft: u(26),
                gap: u(24),
              },
            ]}>
            <Sheen radius={u(26)} strength={0.45} />
            <GlossTile from={s.tint.tile[0]} to={s.tint.tile[1]} radius={u(24)} style={{ width: u(98), height: u(98) }}>
              <Ionicons name={s.icon} size={u(46)} color={s.tint.fg} />
            </GlossTile>
            <MiniBars color={s.tint.bars} u={u} />
            <View style={{ flex: 1, paddingRight: u(12) }}>
              <Text
                style={{ fontFamily: F.semibold, fontSize: u(40), lineHeight: u(48), color: INK, letterSpacing: -0.3 }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {s.value}
              </Text>
              <Text style={{ fontFamily: F.medium, fontSize: fs(25), lineHeight: fs(33), color: t.G.muted, marginTop: u(2), letterSpacing: 0.1 }} numberOfLines={1}>
                {s.label}
              </Text>
              <TrendLine trend={s.trend} u={u} fs={fs} />
            </View>
          </Touchable>
        ))}
      </View>

      {/* ---------- Upcoming events ---------- */}
      <View style={[st.sectionRow, { marginTop: u(36), marginBottom: u(20) }]}>
        <Text style={{ fontFamily: F.semibold, fontSize: u(40), lineHeight: u(52), color: INK, letterSpacing: -0.3 }}>Upcoming Events</Text>
        {upcoming.length ? (
          <Touchable
            onPress={() => router.push({ pathname: '/bookings', params: { filter: 'upcoming' } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: u(6), paddingVertical: u(8) }}>
            <Text style={{ fontFamily: F.medium, fontSize: u(28), lineHeight: u(38), color: LINK }}>See all</Text>
            <Ionicons name="arrow-forward" size={u(25)} color={LINK} />
          </Touchable>
        ) : null}
      </View>
      {upcoming.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="New bookings will appear here." />
      ) : (
        <View style={{ gap: u(20) }}>
          {upcoming.slice(0, 5).map((b) => (
            <EventRow key={b.id} booking={b} />
          ))}
        </View>
      )}

      {/* ---------- Add booking — pinned above the tab bar when content is shorter than the screen ---------- */}
      <View style={{ flexGrow: 1, minHeight: u(30) }} />
      <GlassActionButton title="Add Booking" variant="royal" height={u(120)} onPress={() => router.push('/booking/new')} />
    </Screen>
  );
}

/** Three faint ascending bars tucked into a stat card's right side. */
function MiniBars({ color, u }: { color: string; u: (n: number) => number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', right: u(28), top: u(46), flexDirection: 'row', alignItems: 'flex-end', gap: u(8), opacity: 0.9 }}>
      {[30, 44, 62].map((h) => (
        <View key={h} style={{ width: u(16), height: u(h), borderRadius: u(6), backgroundColor: color }} />
      ))}
    </View>
  );
}

function TrendLine({ trend, u, fs }: { trend: Trend; u: (n: number) => number; fs: (n: number) => number }) {
  const { C } = useTheme();
  const color = trend.dir === 'up' ? C.success : trend.dir === 'down' ? C.danger : C.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(6), marginTop: u(8) }}>
      {trend.dir !== 'flat' ? (
        <Ionicons name={trend.dir === 'up' ? 'arrow-up' : 'arrow-down'} size={fs(20)} color={color} />
      ) : null}
      <Text style={{ fontFamily: F.regular, fontSize: fs(19), lineHeight: fs(26), color, flexShrink: 1 }} numberOfLines={1}>
        {trend.text}
      </Text>
    </View>
  );
}

/** Date tile tint per event type. */
const useSt = makeStyles((t) => ({
  ...StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  }),
}));
