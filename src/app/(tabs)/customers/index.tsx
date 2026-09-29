import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlossTile, GradientFill, glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassBrandHeader } from '@/components/glass-header';
import { EmptyState, Screen, Touchable } from '@/components/primitives';
import { CustomerFormSheet } from '@/components/sheets';
import { initials, todayISO } from '@/lib/format';
import { useStore, type Customer } from '@/lib/store';
import { F, noOutline } from '@/lib/theme';

/** Profiles open inside this tab's stack so the tab bar stays visible. */
const openCustomer = (id: string) => router.push({ pathname: '/customers/[id]', params: { id } });

/** Blue glass palette, shared with Home. */
const INK = '#131D38';
const NAVY = '#1F3A70';
const MUTED = '#5B6275';
const BLUE_DEEP = '#1F4FA8';
const BLUE_BRIGHT = '#3A78D8';

/**
 * Glossy pastel initials circles, assigned in the order customers were added so each keeps its colour
 * and neighbours rarely match. The call button shares the tone.
 */
const AVATAR = [
  { from: '#EEF4FE', to: '#CFDFF8', fg: '#1F4488' },
  { from: '#FDF0F6', to: '#F4D3E4', fg: '#8E1F5A' },
  { from: '#FEF1EC', to: '#F8D6CB', fg: '#B0381E' },
  { from: '#F2F0FD', to: '#D9D4F6', fg: '#3B2E9A' },
  { from: '#ECF7F1', to: '#CBE8D8', fg: '#226B3A' },
];

export default function CustomersScreen() {
  const { customers, bookings } = useStore();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const today = todayISO();

  const countFor = (id: string) => bookings.filter((b) => b.customerId === id).length;
  const isActive = (id: string) =>
    bookings.some((b) => b.customerId === id && b.status !== 'cancelled' && b.date >= today);

  const query = q.trim().toLowerCase();
  const list = customers
    .filter((c) => !query || c.name.toLowerCase().includes(query) || c.phone.includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Screen
        tab
        header={<GlassBrandHeader tagline="Celebrate Beautiful Beginnings" hallIcon="bank" />}
        backdrop={<GlassBackdrop />}
        onRefresh={() => new Promise((r) => setTimeout(r, 500))}
        contentStyle={st.content}>
        {/* Title card */}
        <View style={[st.titleCard, glassSurface('rgba(255, 255, 255, 0.5)', 20)]}>
          <Sheen radius={20} strength={0.5} />
          <View style={{ flex: 1 }}>
            <Text style={st.title}>Customers</Text>
            <Text style={st.subtitle} numberOfLines={1}>
              Manage your customers
            </Text>
          </View>
          <Touchable onPress={() => setAdding(true)} accessibilityRole="button" hitSlop={6} style={st.addBtn}>
            <GradientFill from={BLUE_BRIGHT} to={BLUE_DEEP} radius={12} />
            <Sheen radius={12} strength={0.4} height="50%" />
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={st.addText}>Add Customer</Text>
          </Touchable>
        </View>

        {/* Search */}
        <View style={[st.search, glassSurface('rgba(255, 255, 255, 0.66)', 16)]}>
          <Ionicons name="search-outline" size={21} color={INK} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or phone number..."
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

        <View style={{ gap: 10 }}>
          {list.length === 0 ? (
            query ? (
              <EmptyState icon="search-outline" title="No matches" message={`Nothing found for “${q}”.`} />
            ) : (
              <EmptyState icon="people-outline" title="No customers yet" action="Add customer" onAction={() => setAdding(true)} />
            )
          ) : (
            list.map((c) => (
              <CustomerRow
                key={c.id}
                customer={c}
                tone={AVATAR[customers.indexOf(c) % AVATAR.length]}
                count={countFor(c.id)}
                active={isActive(c.id)}
              />
            ))
          )}
        </View>
      </Screen>

      <CustomerFormSheet visible={adding} onClose={() => setAdding(false)} onSaved={(c) => openCustomer(c.id)} />
    </>
  );
}

function CustomerRow({
  customer,
  tone,
  count,
  active,
}: {
  customer: Customer;
  tone: (typeof AVATAR)[number];
  count: number;
  active: boolean;
}) {
  const phone = customer.phone;
  const status = active
    ? { label: 'Active', icon: 'checkmark-circle-outline' as const, fg: ACTIVE_FG, from: '#E9F7EF', to: '#CDEBDA' }
    : { label: 'Inactive', icon: 'time-outline' as const, fg: INACTIVE_FG, from: '#FDF5E2', to: '#F5E3B8' };

  return (
    // The whole card opens the profile; the call button sits beside it (never nested — web forbids button-in-button).
    <View style={[st.row, glassSurface('rgba(255, 255, 255, 0.58)', 20)]}>
      <Sheen radius={20} strength={0.5} />
      <Touchable
        onPress={() => openCustomer(customer.id)}
        accessibilityRole="button"
        accessibilityLabel={`${customer.name}, ${count} booking${count === 1 ? '' : 's'}, ${active ? 'active' : 'inactive'}`}
        style={StyleSheet.absoluteFill}>
        {null}
      </Touchable>
      <View pointerEvents="none">
        <GlossTile from={tone.from} to={tone.to} radius={25} style={st.avatar}>
          <Text style={[st.avatarText, { color: tone.fg }]}>{initials(customer.name)}</Text>
        </GlossTile>
      </View>

      <View style={{ flex: 1, minWidth: 0 }} pointerEvents="none">
        <Text style={st.name} numberOfLines={1}>
          {customer.name}
        </Text>
        <View style={st.metaRow}>
          <Ionicons name="call" size={14} color={NAVY} />
          <Text style={st.meta} numberOfLines={1}>
            {phone || 'No phone'}
          </Text>
        </View>
        <View style={st.metaRow}>
          <MaterialCommunityIcons name="account-group" size={15} color={NAVY} />
          <Text style={st.meta} numberOfLines={1}>
            {count} Booking{count === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View pointerEvents="none">
        <GlossTile from={status.from} to={status.to} radius={12} style={st.status}>
          <Ionicons name={status.icon} size={16} color={status.fg} />
          <Text style={[st.statusText, { color: status.fg }]}>{status.label}</Text>
        </GlossTile>
      </View>

      <Touchable
        onPress={() => Linking.openURL(`tel:${phone}`)}
        disabled={!phone}
        accessibilityRole="button"
        accessibilityLabel={`Call ${customer.name}`}
        hitSlop={8}
        style={st.callHit}>
        <GlossTile from={tone.from} to={tone.to} radius={18} style={st.call}>
          <Ionicons name="call" size={16} color={tone.fg} />
        </GlossTile>
      </Touchable>
      <Ionicons name="chevron-forward" size={18} color={NAVY} pointerEvents="none" />
    </View>
  );
}

const ACTIVE_FG = '#23784A';
const INACTIVE_FG = '#9A6512';

const st = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 0, gap: 0 },

  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 10,
    marginBottom: 10,
  },
  title: { fontFamily: F.pageSerifBold, fontSize: 33, lineHeight: 40, letterSpacing: -0.8, color: INK },
  subtitle: { fontFamily: F.medium, fontSize: 11.5, letterSpacing: 2, color: MUTED, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 222, 255, 0.95)',
    boxShadow: 'inset 0px 1.5px 0px rgba(255, 255, 255, 0.5), 0px 0px 0px 1px rgba(255, 255, 255, 0.6), 0px 0px 16px rgba(80, 140, 255, 0.55), 0px 8px 18px rgba(24, 60, 140, 0.35)',
  },
  addText: { fontFamily: F.pageSerifBold, fontSize: 14.5, color: '#FFFFFF' },

  search: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 46, paddingHorizontal: 18, marginBottom: 10 },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 13.5, color: INK, paddingVertical: 0, height: '100%' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingLeft: 12, paddingRight: 10 },
  avatar: { width: 50, height: 50, marginRight: 4 },
  avatarText: { fontFamily: F.semibold, fontSize: 16 },
  name: { fontFamily: F.semibold, fontSize: 15.5, lineHeight: 21, color: INK },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  meta: { fontFamily: F.regular, fontSize: 13, color: MUTED, letterSpacing: 0.2, flexShrink: 1 },
  status: { flexDirection: 'row', gap: 6, height: 30, paddingHorizontal: 12 },
  statusText: { fontFamily: F.medium, fontSize: 13 },
  callHit: { borderRadius: 18 },
  call: { width: 36, height: 36 },
});
