import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactBrandHeader } from '@/components/brand-header';
import { openBooking } from '@/components/cards';
import { BrandGradient } from '@/components/decor';
import { EmptyState, Touchable } from '@/components/primitives';
import { fmtDate, inr, MONTHS, parseISO, todayISO } from '@/lib/format';
import { balanceOf, payState, SLOT_LABEL, useStore, type Booking, type PayState } from '@/lib/store';
import { C, elevation, F, noOutline } from '@/lib/theme';

type Filter = 'all' | 'upcoming' | 'unpaid' | 'past';
type SortKey = 'event' | 'booked' | 'name' | 'amount';
type Sort = { key: SortKey; desc: boolean };
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const FILTERS: { key: Filter; label: string; icon: MciName }[] = [
  { key: 'all', label: 'All', icon: 'view-grid' },
  { key: 'upcoming', label: 'Upcoming', icon: 'calendar-blank-outline' },
  { key: 'unpaid', label: 'Unpaid', icon: 'credit-card-outline' },
  { key: 'past', label: 'Past', icon: 'history' },
];

/** Sort chips. Tapping the active chip flips its direction; `desc` is the direction a chip starts in. */
const SORT_CHIPS: { key: SortKey; label: string; icon: MciName; desc: boolean }[] = [
  { key: 'event', label: 'Event date', icon: 'calendar-blank-outline', desc: false },
  { key: 'booked', label: 'Booked on', icon: 'calendar-blank-outline', desc: true },
  { key: 'name', label: 'Name', icon: 'account-outline', desc: false },
  { key: 'amount', label: 'Amount', icon: 'format-list-bulleted', desc: true },
];

/** Text/icon colour of the active (gold) sort chip. */
const SORT_ON_FG = '#6B4A1A';

const EMPTY: Record<Filter, string> = {
  upcoming: 'No upcoming bookings',
  unpaid: 'Everything is paid up',
  past: 'No past bookings',
  all: 'No bookings yet',
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingsScreen() {
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const insets = useSafeAreaInsets();
  const { bookings, customerById } = useStore();
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const [sort, setSort] = useState<Sort>({ key: 'amount', desc: true });
  const [refreshing, setRefreshing] = useState(false);
  const today = todayISO();

  // Light status bar only while this tab (with its burgundy header) is on screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

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

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  return (
    <View style={st.screen}>
      {focused ? <StatusBar style="light" /> : null}
      {/* Header stays pinned; only the content below it scrolls. */}
      <CompactBrandHeader topInset={insets.top} />
      <ScrollView
        contentContainerStyle={st.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
          ) : undefined
        }>
        <View style={st.sheet}>
          <View style={st.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.title}>Bookings</Text>
              <Text style={st.subtitle}>Manage all your hall bookings</Text>
            </View>
            <Touchable
              onPress={() => router.push('/booking/new')}
              accessibilityRole="button"
              hitSlop={6}
              style={st.addBtn}>
              <BrandGradient id="bookingsAddGrad" from={C.gradientTo} to={C.primaryDark} />
              <Ionicons name="add" size={20} color={C.onPrimary} />
              <Text style={st.addText}>Add Booking</Text>
            </Touchable>
          </View>

          <View style={st.searchRow}>
            <View style={st.search}>
              <Ionicons name="search-outline" size={19} color={C.text} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search name, phone or booking no."
                placeholderTextColor={C.textSecondary}
                returnKeyType="search"
                style={[st.searchInput, noOutline]}
              />
              {q ? (
                <Touchable onPress={() => setQ('')} accessibilityLabel="Clear search" hitSlop={10}>
                  <Ionicons name="close-circle" size={17} color={C.textMuted} />
                </Touchable>
              ) : null}
            </View>
          </View>

          <View style={st.tabs}>
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
                    {on ? <BrandGradient id="bookingsTabGrad" from={C.gradientTo} to={C.primaryDark} /> : null}
                    <MaterialCommunityIcons name={f.icon} size={17} color={on ? C.onPrimary : C.primary} />
                    <Text style={[st.tabText, on && st.tabTextOn]} numberOfLines={1}>
                      {f.label}
                    </Text>
                  </Touchable>
                  {i < FILTERS.length - 1 && !on && !nextOn ? <View style={st.tabDivider} /> : null}
                </View>
              );
            })}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.chips}
            style={st.chipsScroll}>
            {SORT_CHIPS.map((c) => {
              const on = sort.key === c.key;
              return (
                <Touchable
                  key={c.key}
                  onPress={() => setSort(on ? { key: c.key, desc: !sort.desc } : { key: c.key, desc: c.desc })}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by ${c.label}`}
                  accessibilityState={{ selected: on }}
                  style={[st.chip, on && st.chipOn]}>
                  <MaterialCommunityIcons name={c.icon} size={13} color={on ? SORT_ON_FG : C.primary} />
                  <Text style={[st.chipText, on && { color: SORT_ON_FG }]} numberOfLines={1}>
                    {c.label}
                  </Text>
                  {on ? (
                    <Ionicons name={sort.desc ? 'arrow-down' : 'arrow-up'} size={12} color={SORT_ON_FG} />
                  ) : (
                    <Ionicons name="chevron-down" size={11} color={C.text} />
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
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- Booking row ----------

/** Date tile tint follows the payment state, matching the pill beside the amount. */
const TILE: Record<PayState, { bg: string; fg: string }> = {
  cancelled: { bg: '#FCEBEE', fg: C.primary },
  unpaid: { bg: '#FBF1E1', fg: C.primary },
  due: { bg: '#E6F3EA', fg: '#1F5E45' },
  paid: { bg: '#E6F3EA', fg: '#1F5E45' },
};

type PillSpec = { label: string; fg: string; bg: string; icon: ComponentProps<typeof Ionicons>['name']; iconColor?: string };

function pillFor(b: Booking): PillSpec {
  switch (payState(b)) {
    case 'cancelled':
      return { label: 'CANCELLED', fg: '#C8283A', bg: '#FDE8EB', icon: 'close-circle-outline' };
    case 'unpaid':
      return { label: 'UNPAID', fg: '#5E5A5B', bg: '#EFEDEB', icon: 'time-outline' };
    case 'due':
      return { label: `DUE ${inr(balanceOf(b))}`, fg: '#7E530C', bg: '#FCEFD4', icon: 'alert-circle', iconColor: '#B97A10' };
    case 'paid':
      return { label: 'PAID', fg: C.success, bg: C.successSoft, icon: 'checkmark-circle-outline' };
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
      style={st.row}>
      <View style={[st.tile, { backgroundColor: tile.bg }]}>
        <Text style={[st.tileDay, { color: tile.fg }]}>{String(d.getDate()).padStart(2, '0')}</Text>
        <Text style={[st.tileMonth, { color: tile.fg }]}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
        <Text style={st.tileWeekday}>{DAY_SHORT[d.getDay()]}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.rowName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={st.rowMeta} numberOfLines={1}>
          {meta}
        </Text>
        <View style={st.bookedRow}>
          <MaterialCommunityIcons name="calendar-edit" size={13} color={C.textSecondary} />
          <Text style={st.bookedText} numberOfLines={1}>
            Booked on {fmtDate(booking.bookedOn)}
          </Text>
        </View>
      </View>

      <View style={st.rowRight}>
        <Text style={st.amount}>{inr(booking.total)}</Text>
        <View style={[st.pill, { backgroundColor: pill.bg }]}>
          <Ionicons name={pill.icon} size={14} color={pill.iconColor ?? pill.fg} />
          <Text style={[st.pillText, { color: pill.fg }]} numberOfLines={1}>
            {pill.label}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={17} color={C.textSecondary} />
    </Touchable>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 14, paddingBottom: 24 },

  /** Title, search, filters and the booking list, laid straight on the page. */
  sheet: {
    marginTop: 6,
    paddingTop: 14,
    paddingBottom: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 6, marginBottom: 12 },
  title: { fontFamily: F.serifBold, fontSize: 33, lineHeight: 37, color: C.primary },
  subtitle: { fontFamily: F.regular, fontSize: 11.5, color: C.textSecondary, marginTop: -1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    overflow: 'hidden',
    ...elevation,
  },
  addText: { fontFamily: F.semibold, fontSize: 13.5, color: C.onPrimary },

  searchRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#EDE5DE',
    ...elevation,
    shadowOpacity: 0.04,
  },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 12.5, color: C.text, paddingVertical: 0, height: '100%' },

  tabs: {
    flexDirection: 'row',
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F7F2ED',
    borderWidth: 1,
    borderColor: '#EFE7E0',
    marginBottom: 10,
  },
  tabSlot: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  tab: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabOn: {
    marginVertical: -1,
    height: 36,
    shadowColor: '#57152C',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabText: { fontFamily: F.regular, fontSize: 12.5, color: C.text },
  tabTextOn: { fontFamily: F.medium, color: C.onPrimary },
  tabDivider: { width: 1, height: 16, backgroundColor: '#E3D9D0' },

  chipsScroll: { marginHorizontal: -14, marginBottom: 12 },
  chips: { flexGrow: 1, gap: 4, paddingHorizontal: 14 },
  chip: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#E8DED6',
  },
  chipOn: { backgroundColor: '#FBF3E3', borderColor: '#D9B77A' },
  chipText: { fontFamily: F.regular, fontSize: 11, color: C.text },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
    paddingLeft: 12,
    paddingRight: 9,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#F0E9E3',
    ...elevation,
    shadowOpacity: 0.05,
  },
  tile: { width: 46, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tileDay: { fontFamily: F.serifBold, fontSize: 21, lineHeight: 22, fontVariant: ['lining-nums'] },
  tileMonth: { fontFamily: F.medium, fontSize: 9.5, lineHeight: 12 },
  tileWeekday: { fontFamily: F.regular, fontSize: 9.5, lineHeight: 12, color: C.textSecondary },
  rowName: { fontFamily: F.semibold, fontSize: 14, lineHeight: 18, color: C.text },
  rowMeta: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 16, color: C.textSecondary, marginTop: 1 },
  metaDot: { color: C.textMuted },
  bookedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  bookedText: { fontFamily: F.regular, fontSize: 11, color: C.textSecondary, flexShrink: 1 },
  rowRight: { alignItems: 'center', gap: 6 },
  amount: { fontFamily: F.bold, fontSize: 15, color: C.text },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: { fontFamily: F.medium, fontSize: 10.5, letterSpacing: 0.2 },
});
