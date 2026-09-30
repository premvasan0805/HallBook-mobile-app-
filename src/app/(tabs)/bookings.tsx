import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { EventRow, useRowGap } from '@/components/event-row';
import { GradientFill, glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassBrandHeader } from '@/components/glass-header';
import { EmptyState, Screen, Touchable } from '@/components/primitives';
import { todayISO } from '@/lib/format';
import { balanceOf, useStore } from '@/lib/store';
import { F, noOutline } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

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

const EMPTY: Record<Filter, string> = {
  upcoming: 'No upcoming bookings',
  unpaid: 'Everything is paid up',
  past: 'No past bookings',
  all: 'No bookings yet',
};

export default function BookingsScreen() {
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const { bookings, customerById } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const rowGap = useRowGap();
  const [sort, setSort] = useState<Sort>({ key: 'amount', desc: true });
  const today = todayISO();
  const t = useTheme();
  const st = useSt();

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
      <View style={[st.titleCard, glassSurface(t, t.frost(0.5), 20)]}>
        <Sheen radius={20} strength={0.5} />
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Bookings</Text>
          <Text style={st.subtitle} numberOfLines={1}>
            Manage all your hall bookings
          </Text>
        </View>
        <Touchable onPress={() => router.push('/booking/new')} accessibilityRole="button" hitSlop={6} style={st.addBtn}>
          <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={14} fromOpacity={0.8} toOpacity={0.68} />
          <Sheen radius={14} strength={0.3} height="50%" />
          <Ionicons name="add" size={22} color={t.G.onBlue} />
          <Text style={st.addText}>Add Booking</Text>
        </Touchable>
      </View>

      {/* Search */}
      <View style={[st.search, glassSurface(t, t.frost(0.66), 14)]}>
        <Ionicons name="search-outline" size={20} color={t.G.ink} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search name, phone or booking no."
          placeholderTextColor={t.G.placeholder}
          returnKeyType="search"
          style={[st.searchInput, noOutline]}
        />
        {q ? (
          <Touchable onPress={() => setQ('')} accessibilityLabel="Clear search" hitSlop={10}>
            <Ionicons name="close-circle" size={17} color={t.G.muted} />
          </Touchable>
        ) : null}
      </View>

      {/* Filter tabs */}
      <View style={[st.tabs, glassSurface(t, t.frost(0.5), 16)]}>
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
                    <GradientFill from={t.G.gradTo} to={t.G.gradFrom} radius={13} horizontal />
                    <Sheen radius={13} strength={0.25} height="50%" />
                  </>
                ) : null}
                <MaterialCommunityIcons name={f.icon} size={18} color={on ? t.G.onBlue : t.G.navy} />
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
              style={[st.chip, glassSurface(t, on ? t.tint(0.9) : t.frost(0.62), 12), on && st.chipOn]}>
              <MaterialCommunityIcons name={c.icon} size={14} color={on ? t.G.deep : t.G.navy} />
              <Text style={[st.chipText, on && { color: t.G.deep }]} numberOfLines={1}>
                {c.label}
              </Text>
              {on ? (
                <Ionicons name={sort.desc ? 'arrow-down' : 'arrow-up'} size={13} color={t.G.deep} />
              ) : (
                <Ionicons name="chevron-down" size={13} color={t.G.navy} />
              )}
            </Touchable>
          );
        })}
      </ScrollView>

      <View style={{ gap: rowGap }}>
        {list.length === 0 ? (
          <EmptyState
            icon={query ? 'search-outline' : 'receipt-outline'}
            title={query ? 'No matches' : EMPTY[filter]}
            message={query ? `Nothing found for “${q}”.` : undefined}
          />
        ) : (
          list.map((b) => <EventRow key={b.id} booking={b} />)
        )}
      </View>
    </Screen>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
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
    title: { fontFamily: F.semibold, fontSize: 26, lineHeight: 31, letterSpacing: -0.3, color: t.G.ink },
    subtitle: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 17, color: t.G.muted, marginTop: 1 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
    },
    addText: { fontFamily: F.semibold, fontSize: 14, color: t.G.onBlue },

    search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 14, marginBottom: 10 },
    searchInput: { flex: 1, fontFamily: F.regular, fontSize: 13.5, color: t.G.ink, paddingVertical: 0, height: '100%' },

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
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
    },
    tabText: { fontFamily: F.medium, fontSize: 13, lineHeight: 17, color: t.G.ink },
    tabTextOn: { fontFamily: F.semibold, color: t.G.onBlue },
    tabDivider: { width: 1, height: 20, backgroundColor: t.G.rule },

    chipsScroll: { marginHorizontal: -14, marginBottom: 12 },
    chips: { flexGrow: 1, gap: 5, paddingHorizontal: 14, paddingVertical: 4 },
    chip: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 34, paddingHorizontal: 7 },
    chipOn: { borderColor: t.G.focusBorder },
    chipText: { fontFamily: F.medium, fontSize: 11.5, lineHeight: 15, letterSpacing: 0.1, color: t.G.ink },

  }),
);
