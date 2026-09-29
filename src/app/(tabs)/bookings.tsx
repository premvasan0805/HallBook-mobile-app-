import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { openBooking } from '@/components/cards';
import { GlossTile, GradientFill, glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassBrandHeader } from '@/components/glass-header';
import { EmptyState, Screen, Touchable } from '@/components/primitives';
import { fmtDate, inr, MONTHS, parseISO, todayISO } from '@/lib/format';
import { balanceOf, payState, SLOT_LABEL, useStore, type Booking, type PayState } from '@/lib/store';
import { F, noOutline } from '@/lib/theme';

type Filter = 'all' | 'upcoming' | 'unpaid' | 'past';
type SortKey = 'event' | 'booked' | 'name' | 'amount';
type Sort = { key: SortKey; desc: boolean };
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const FILTERS: { key: Filter; label: string; icon: MciName }[] = [
  { key: 'all', label: 'All', icon: 'view-grid-outline' },
  { key: 'upcoming', label: 'Upcoming', icon: 'calendar-month-outline' },
  { key: 'unpaid', label: 'Unpaid', icon: 'credit-card-outline' },
  { key: 'past', label: 'Past', icon: 'history' },
];

/** Sort chips. Tapping the active chip flips its direction; `desc` is the direction a chip starts in. */
const SORT_CHIPS: { key: SortKey; label: string; icon: MciName; desc: boolean }[] = [
  { key: 'event', label: 'Event date', icon: 'calendar-blank-outline', desc: false },
  { key: 'booked', label: 'Booked on', icon: 'calendar-month-outline', desc: true },
  { key: 'name', label: 'Name', icon: 'account-outline', desc: false },
  { key: 'amount', label: 'Amount', icon: 'format-list-bulleted', desc: true },
];

/** Blue glass palette, shared with Home. */
const INK = '#131D38';
const NAVY = '#1F3A70';
const MUTED = '#5B6275';
/** Deep and bright ends of the blue on the active filter tab and the Add Booking button. */
const BLUE_DEEP = '#1F4FA8';
const BLUE_BRIGHT = '#3A78D8';
/** Text/icon colour of the active (gold) sort chip. */
const SORT_ON_FG = '#1F4488';

const EMPTY: Record<Filter, string> = {
  upcoming: 'No upcoming bookings',
  unpaid: 'Everything is paid up',
  past: 'No past bookings',
  all: 'No bookings yet',
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingsScreen() {
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const { bookings, customerById } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const [sort, setSort] = useState<Sort>({ key: 'amount', desc: true });
  const today = todayISO();

  // Deep links from Home ("See all", "Due") switch the active tab (adjust state during render, no effect).
  const [lastParam, setLastParam] = useState(params.filter);
  if (params.filter !== lastParam) {
    setLastParam(params.filter);
    if (params.filter) setFilter(params.filter);
  }

  const query = q.trim().toLowerCase();
  const name = (id: string) => customerById(id)?.name ?? '';
  const list = bookings
    .filter((b) => {
      if (filter === 'upcoming') return b.date >= today && b.status !== 'cancelled';
      if (filter === 'unpaid') return b.status !== 'cancelled' && balanceOf(b) > 0;
      if (filter === 'past') return b.date < today;
      return true;
    })
    .filter((b) => {
      if (!query) return true;
      const c = customerById(b.customerId);
      return (
        c?.name.toLowerCase().includes(query) ||
        c?.phone.includes(query) ||
        b.number.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const asc = (() => {
        switch (sort.key) {
          case 'event':
            return a.date.localeCompare(b.date);
          case 'booked':
            return a.bookedOn.localeCompare(b.bookedOn);
          case 'name':
            return name(a.customerId).localeCompare(name(b.customerId));
          case 'amount':
            return a.total - b.total;
        }
      })();
      return sort.desc ? -asc : asc;
    });

  return (
    <Screen
      tab
      header={<GlassBrandHeader />}
      backdrop={<GlassBackdrop />}
      onRefresh={() => new Promise((r) => setTimeout(r, 500))}
      contentStyle={st.content}>
      {/* Title card */}
      <View style={[st.titleCard, glassSurface('rgba(255, 255, 255, 0.5)', 20)]}>
        <Sheen radius={20} strength={0.5} />
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Bookings</Text>
          <Text style={st.subtitle} numberOfLines={1}>
            Manage all your hall bookings
          </Text>
        </View>
        <Touchable onPress={() => router.push('/booking/new')} accessibilityRole="button" hitSlop={6} style={st.addBtn}>
          <GradientFill from={BLUE_BRIGHT} to={BLUE_DEEP} radius={14} />
          <Sheen radius={14} strength={0.35} height="50%" />
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={st.addText}>Add Booking</Text>
        </Touchable>
      </View>

      {/* Search */}
      <View style={[st.search, glassSurface('rgba(255, 255, 255, 0.66)', 14)]}>
        <Ionicons name="search-outline" size={20} color={INK} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search name, phone or booking no."
          placeholderTextColor={MUTED}
          returnKeyType="search"
          style={[st.searchInput, noOutline]}
        />
        {q ? (
          <Touchable onPress={() => setQ('')} accessibilityLabel="Clear search" hitSlop={10}>
            <Ionicons name="close-circle" size={17} color={MUTED} />
          </Touchable>
        ) : null}
      </View>

      {/* Filter tabs */}
      <View style={[st.tabs, glassSurface('rgba(255, 255, 255, 0.5)', 16)]}>
        {FILTERS.map((f, i) => {
          const on = f.key === filter;
          const nextOn = FILTERS[i + 1]?.key === filter;
          return (
            <View key={f.key} style={st.tabSlot}>
              <Touchable
                onPress={() => setFilter(f.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[st.tab, on && st.tabOn]}>
                {on ? (
                  <>
                    <GradientFill from={BLUE_DEEP} to={BLUE_BRIGHT} radius={13} horizontal />
                    <Sheen radius={13} strength={0.3} height="50%" />
                  </>
                ) : null}
                <MaterialCommunityIcons name={f.icon} size={18} color={on ? '#FFFFFF' : NAVY} />
                <Text style={[st.tabText, on && st.tabTextOn]} numberOfLines={1}>
                  {f.label}
                </Text>
              </Touchable>
              {i < FILTERS.length - 1 && !on && !nextOn ? <View style={st.tabDivider} /> : null}
            </View>
          );
        })}
      </View>

      {/* Sort chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips} style={st.chipsScroll}>
        {SORT_CHIPS.map((c) => {
          const on = sort.key === c.key;
          return (
            <Touchable
              key={c.key}
              onPress={() => setSort(on ? { key: c.key, desc: !sort.desc } : { key: c.key, desc: c.desc })}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${c.label}`}
              accessibilityState={{ selected: on }}
              style={[
                st.chip,
                glassSurface(on ? 'rgba(226, 236, 252, 0.9)' : 'rgba(255, 255, 255, 0.62)', 12),
                on && st.chipOn,
              ]}>
              <MaterialCommunityIcons name={c.icon} size={14} color={on ? SORT_ON_FG : NAVY} />
              <Text style={[st.chipText, on && { color: SORT_ON_FG }]} numberOfLines={1}>
                {c.label}
              </Text>
              {on ? (
                <Ionicons name={sort.desc ? 'arrow-down' : 'arrow-up'} size={13} color={SORT_ON_FG} />
              ) : (
                <Ionicons name="chevron-down" size={13} color={NAVY} />
              )}
            </Touchable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 10 }}>
        {list.length === 0 ? (
          <EmptyState
            icon={query ? 'search-outline' : 'receipt-outline'}
            title={query ? 'No matches' : EMPTY[filter]}
            message={query ? `Nothing found for “${q}”.` : undefined}
          />
        ) : (
          list.map((b) => <BookingRow key={b.id} booking={b} />)
        )}
      </View>
    </Screen>
  );
}

// ---------- Booking row ----------

type Gloss = { from: string; to: string; fg: string };
const BLUE_TILE: Gloss = { from: '#F0F5FE', to: '#D3E2F9', fg: '#1D3E7E' };
const MINT_TILE: Gloss = { from: '#E8F6EF', to: '#C8E8D8', fg: '#1E5C4E' };
const ROSE_TILE: Gloss = { from: '#FDF0F2', to: '#F8D6DD', fg: '#B3203F' };

/** Date tile tint follows the payment state: blue when nothing is paid, mint once money is in, rose when cancelled. */
const TILE: Record<PayState, Gloss> = { unpaid: BLUE_TILE, due: MINT_TILE, paid: MINT_TILE, cancelled: ROSE_TILE };

type PillSpec = Gloss & { label: string; icon: ComponentProps<typeof Ionicons>['name']; iconColor?: string };

const ROSE_PILL = { from: '#FDECF0', to: '#F8D2DB' };

function pillFor(b: Booking): PillSpec {
  switch (payState(b)) {
    case 'cancelled':
      return { label: 'CANCELLED', fg: '#C8283A', ...ROSE_PILL, icon: 'close-circle-outline' };
    case 'unpaid':
      return { label: 'UNPAID', fg: '#A8123A', ...ROSE_PILL, icon: 'time-outline' };
    case 'due':
      return { label: `DUE ${inr(balanceOf(b))}`, fg: '#86601F', from: '#FDF3DD', to: '#F5DFB0', icon: 'alert-circle', iconColor: '#C98A12' };
    case 'paid':
      return { label: 'PAID', fg: '#23804F', from: '#E8F7EE', to: '#C9EAD5', icon: 'checkmark-circle', iconColor: '#2E9A5E' };
  }
}

function BookingRow({ booking }: { booking: Booking }) {
  const { customerById } = useStore();
  const name = customerById(booking.customerId)?.name ?? 'Unknown customer';
  const d = parseISO(booking.date);
  const tile = TILE[payState(booking)];
  const pill = pillFor(booking);
  const meta: ReactNode = booking.eventType ? (
    <>
      {SLOT_LABEL[booking.slot]}
      <Text style={st.metaDot}>{'  •  '}</Text>
      {booking.eventType}
    </>
  ) : (
    SLOT_LABEL[booking.slot]
  );

  return (
    <Touchable
      onPress={() => openBooking(booking.id)}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${fmtDate(booking.date)}, ${inr(booking.total)}, ${pill.label}`}
      style={[st.row, glassSurface('rgba(255, 255, 255, 0.6)', 18)]}>
      <Sheen radius={18} strength={0.5} />
      <GlossTile from={tile.from} to={tile.to} radius={12} style={st.tile}>
        <Text style={[st.tileDay, { color: tile.fg }]}>{String(d.getDate()).padStart(2, '0')}</Text>
        <Text style={[st.tileMonth, { color: tile.fg }]}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
        <Text style={[st.tileWeekday, { color: tile.fg }]}>{DAY_SHORT[d.getDay()]}</Text>
      </GlossTile>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.rowName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={st.rowMeta} numberOfLines={1}>
          {meta}
        </Text>
        <View style={st.bookedRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={MUTED} />
          <Text style={st.bookedText} numberOfLines={1}>
            Booked on {fmtDate(booking.bookedOn)}
          </Text>
        </View>
      </View>

      <View style={st.rowRight}>
        <Text style={st.amount}>{inr(booking.total)}</Text>
        <GlossTile from={pill.from} to={pill.to} radius={13} style={st.pill}>
          <Ionicons name={pill.icon} size={15} color={pill.iconColor ?? pill.fg} />
          <Text style={[st.pillText, { color: pill.fg }]} numberOfLines={1}>
            {pill.label}
          </Text>
        </GlossTile>
      </View>
      <Ionicons name="chevron-forward" size={18} color={NAVY} />
    </Touchable>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 0, gap: 0 },

  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 8,
    marginBottom: 10,
  },
  title: { fontFamily: F.serifBold, fontSize: 34, lineHeight: 38, color: INK },
  subtitle: { fontFamily: F.regular, fontSize: 12, color: MUTED, marginTop: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    boxShadow: 'inset 0px 1.5px 0px rgba(255, 255, 255, 0.45), 0px 6px 14px rgba(24, 60, 140, 0.3)',
  },
  addText: { fontFamily: F.semibold, fontSize: 14, color: '#FFFFFF' },

  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 14, marginBottom: 10 },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 13.5, color: INK, paddingVertical: 0, height: '100%' },

  tabs: { flexDirection: 'row', height: 46, padding: 3, marginBottom: 10 },
  tabSlot: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  tab: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 13,
  },
  tabOn: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    boxShadow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.4), 0px 5px 12px rgba(24, 60, 140, 0.32)',
  },
  tabText: { fontFamily: F.regular, fontSize: 13, color: INK },
  tabTextOn: { fontFamily: F.medium, color: '#FFFFFF' },
  tabDivider: { width: 1, height: 20, backgroundColor: 'rgba(31, 58, 112, 0.14)' },

  chipsScroll: { marginHorizontal: -14, marginBottom: 12 },
  chips: { flexGrow: 1, gap: 5, paddingHorizontal: 14, paddingVertical: 4 },
  chip: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 34, paddingHorizontal: 7 },
  chipOn: { borderColor: '#A9C3EC' },
  chipText: { fontFamily: F.regular, fontSize: 11.5, color: INK },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10 },
  tile: { width: 50, height: 56 },
  tileDay: { fontFamily: F.serifBold, fontSize: 23, lineHeight: 25, fontVariant: ['lining-nums'] },
  tileMonth: { fontFamily: F.medium, fontSize: 10, lineHeight: 12 },
  tileWeekday: { fontFamily: F.regular, fontSize: 10, lineHeight: 12, opacity: 0.85 },
  rowName: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, color: INK },
  rowMeta: { fontFamily: F.regular, fontSize: 12, lineHeight: 17, color: MUTED, marginTop: 1 },
  metaDot: { color: MUTED },
  bookedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  bookedText: { fontFamily: F.regular, fontSize: 11.5, color: MUTED, flexShrink: 1 },
  rowRight: { alignItems: 'flex-end', gap: 7 },
  amount: { fontFamily: F.bold, fontSize: 15.5, color: INK },
  pill: { flexDirection: 'row', gap: 5, height: 26, paddingHorizontal: 11 },
  pillText: { fontFamily: F.medium, fontSize: 11, letterSpacing: 0.3 },
});
