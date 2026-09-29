import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { openBooking } from '@/components/cards';
import { currentYM, shiftMonth } from '@/components/calendar';
import { BlueWash, GlossTile, glassSurface, Sheen } from '@/components/glass';
import { GlassActionButton } from '@/components/glass-action';
import { HomeHero } from '@/components/home-hero';
import { EmptyState, Screen, Touchable, type IconName } from '@/components/primitives';
import { fmtClock, fmtLong, greeting, initials, inr, inrShort, MONTHS, parseISO, todayISO } from '@/lib/format';
import { balanceOf, payState, SLOT_LABEL, useStore, type Booking, type Segment } from '@/lib/store';
import { appWidth, C, F } from '@/lib/theme';

/** Home is laid out on the 903px-wide design reference; `u(px)` converts a reference pixel to dp. */
const REF_WIDTH = 903;
/** Side padding of the page content, in reference px. */
const PAD = 32;

/** Pre-blurred venue photo behind the whole page; the glass cards are translucent over it. */
const BACKDROP = require('../../../assets/images/home/home-backdrop.jpg');

type Tint = { card: string; tile: [string, string]; fg: string; bars: string };
/** Stat cards share one cool frost body; the pastel accent lives only in the icon tile and bars. */
const FROST = 'rgba(246, 249, 255, 0.58)';
/** Glass tints for the four stat cards, matched to the design reference. */
const TINTS: Record<'sky' | 'mint' | 'sand' | 'lilac', Tint> = {
  sky: { card: FROST, tile: ['#F0F5FE', '#CFE0FA'], fg: '#1F4A9A', bars: '#78A9EA' },
  mint: { card: FROST, tile: ['#E6F6EE', '#BFE6D1'], fg: '#1E7A4C', bars: '#A3DABF' },
  sand: { card: FROST, tile: ['#FCF4E2', '#F0DFBA'], fg: '#7A5418', bars: '#EDCF99' },
  lilac: { card: FROST, tile: ['#F3EEFD', '#DDD0F5'], fg: '#4A2E8A', bars: '#C9B6F2' },
};

/** Home's blue glass palette. */
const INK = '#131D38';
const NAVY = '#1F3A70';
const LINK = '#1F4488';
const MUTED = '#5B6275';

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

  const stats: { icon: IconName; value: string; label: string; tint: Tint; trend: Trend; onPress?: () => void }[] = [
    {
      icon: 'bar-chart',
      value: inrShort(sum.revenue),
      label: 'Revenue',
      tint: TINTS.sky,
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
      tint: TINTS.sand,
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
      backdrop={
        <>
          <Image source={BACKDROP} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
          <BlueWash />
        </>
      }
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
              glassSurface(s.tint.card, u(26)),
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
                style={{ fontFamily: F.bold, fontSize: u(35), lineHeight: u(43), color: INK }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {s.value}
              </Text>
              <Text style={{ fontFamily: F.regular, fontSize: fs(23), color: MUTED, marginTop: u(2) }} numberOfLines={1}>
                {s.label}
              </Text>
              <TrendLine trend={s.trend} u={u} fs={fs} />
            </View>
          </Touchable>
        ))}
      </View>

      {/* ---------- Upcoming events ---------- */}
      <View style={[st.sectionRow, { marginTop: u(36), marginBottom: u(20) }]}>
        <Text style={{ fontFamily: F.serifBold, fontSize: u(44), lineHeight: u(52), color: INK }}>Upcoming Events</Text>
        {upcoming.length ? (
          <Touchable
            onPress={() => router.push({ pathname: '/bookings', params: { filter: 'upcoming' } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: u(6), paddingVertical: u(8) }}>
            <Text style={{ fontFamily: F.medium, fontSize: u(25), color: LINK }}>See all</Text>
            <Ionicons name="arrow-forward" size={u(25)} color={LINK} />
          </Touchable>
        ) : null}
      </View>
      {upcoming.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="New bookings will appear here." />
      ) : (
        <View style={{ gap: u(20) }}>
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

/** Date tile tint per event type, matched to the design reference. */
const DATE_TILE: Record<string, { from: string; to: string; fg: string }> = {
  Party: { from: '#F0F5FE', to: '#D3E2F9', fg: '#1D3E7E' },
  Wedding: { from: '#E8F6EF', to: '#C8E8D8', fg: '#1E5C4E' },
  Engagement: { from: '#FCF4E2', to: '#F2E1BD', fg: '#7A5418' },
  Reception: { from: '#F3EFFC', to: '#DDD3F4', fg: '#1D2F6E' },
};

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
  const block = DATE_TILE[booking.eventType] ?? DATE_TILE.Party;
  const pay = payState(booking);
  const badge =
    pay === 'paid'
      ? { label: 'PAID', from: '#E6F6EC', to: '#C9EAD5', fg: '#23804F' }
      : pay === 'due'
        ? { label: `DUE ${inr(balanceOf(booking))}`, from: '#FDF1D8', to: '#F3DAA8', fg: '#86601F' }
        : { label: 'UNPAID', from: '#FDE8EE', to: '#F8CFDB', fg: '#A8123A' };

  return (
    <Touchable
      onPress={() => openBooking(booking.id)}
      accessibilityLabel={`${name}, ${booking.eventType}, ${inr(booking.total)}, ${badge.label}`}
      style={[
        st.card,
        glassSurface(FROST, u(26)),
        { minHeight: u(154), paddingLeft: u(20), paddingRight: u(24), gap: u(26) },
      ]}>
      <Sheen radius={u(26)} strength={0.5} />
      <GlossTile from={block.from} to={block.to} radius={u(20)} style={{ width: u(104), height: u(108) }}>
        <Text style={{ fontFamily: F.serifBold, fontSize: u(46), lineHeight: u(50), color: block.fg, fontVariant: ['lining-nums'] }}>
          {String(d.getDate()).padStart(2, '0')}
        </Text>
        <Text style={{ fontFamily: F.regular, fontSize: fs(23), color: '#2E3A57', letterSpacing: 0.5 }}>
          {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}
        </Text>
      </GlossTile>
      <View style={{ flex: 1, paddingVertical: u(16) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10) }}>
          <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: u(28), lineHeight: u(37), color: INK }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ fontFamily: F.bold, fontSize: u(27), lineHeight: u(37), color: INK }}>
            {inr(booking.total)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10), marginTop: u(2) }}>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: fs(23), color: MUTED }} numberOfLines={1}>
            {booking.eventType} · {SLOT_LABEL[booking.slot]}
          </Text>
          <GlossTile from={badge.from} to={badge.to} radius={u(22)} style={{ paddingHorizontal: u(20), paddingVertical: u(2) }}>
            <Text style={{ fontFamily: F.semibold, fontSize: fs(20), color: badge.fg, letterSpacing: 0.3 }}>{badge.label}</Text>
          </GlossTile>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(8), gap: u(10) }}>
          <Ionicons name="time-outline" size={fs(22)} color={NAVY} />
          <Text style={[st.meta(fs), { flexShrink: 0 }]} numberOfLines={1}>
            {time}
          </Text>
          <Ionicons name="location-outline" size={fs(23)} color={NAVY} style={{ marginLeft: u(18) }} />
          <Text style={[st.meta(fs), { flexShrink: 1 }]} numberOfLines={1}>
            {hall}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={u(30)} color={NAVY} />
    </Touchable>
  );
}

const st = {
  ...StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  }),
  meta: (u: (n: number) => number) => ({ fontFamily: F.regular, fontSize: u(21), color: MUTED }),
};
