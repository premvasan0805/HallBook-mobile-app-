import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import { RowCard, TileText, useRowGap, useRowScale } from '@/components/event-row';
import { GlossTile, GradientFill, glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassBrandHeader } from '@/components/glass-header';
import { EmptyState, Screen, Touchable } from '@/components/primitives';
import { CustomerFormSheet } from '@/components/sheets';
import { initials, todayISO } from '@/lib/format';
import { useStore, type Customer } from '@/lib/store';
import { F, noOutline, type Theme, type Tone } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/** Profiles open inside this tab's stack so the tab bar stays visible. */
const openCustomer = (id: string) => router.push({ pathname: '/customers/[id]', params: { id } });

/**
 * Glossy pastel initials circles, assigned in the order customers were added so each keeps its colour
 * and neighbours rarely match. The call button shares the tone.
 */
const avatarTones = ({ tone }: Theme): Tone[] => [tone.blue, tone.rose, tone.peach, tone.violet, tone.mint];

export default function CustomersScreen() {
  const { customers, bookings } = useStore();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const today = todayISO();
  const t = useTheme();
  const st = useSt();
  const rowGap = useRowGap();
  const avatars = avatarTones(t);

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
        <View style={[st.titleCard, glassSurface(t, t.frost(0.5), 20)]}>
          <Sheen radius={20} strength={0.5} />
          <View style={{ flex: 1 }}>
            <Text style={st.title}>Customers</Text>
            <Text style={st.subtitle} numberOfLines={1}>
              Manage your customers
            </Text>
          </View>
          <Touchable onPress={() => setAdding(true)} accessibilityRole="button" hitSlop={6} style={st.addBtn}>
            <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={12} fromOpacity={0.8} toOpacity={0.68} />
            <Sheen radius={12} strength={0.4} height="50%" />
            <Ionicons name="add" size={22} color={t.G.onBlue} />
            <Text style={st.addText}>Add Customer</Text>
          </Touchable>
        </View>

        {/* Search */}
        <View style={[st.search, glassSurface(t, t.frost(0.66), 16)]}>
          <Ionicons name="search-outline" size={21} color={t.G.ink} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or phone number..."
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

        <View style={{ gap: rowGap }}>
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
                tone={avatars[customers.indexOf(c) % avatars.length]}
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
  tone: Tone;
  count: number;
  active: boolean;
}) {
  const { u } = useRowScale();
  const phone = customer.phone;

  return (
    <RowCard
      onPress={() => openCustomer(customer.id)}
      accessibilityLabel={`${customer.name}, ${count} booking${count === 1 ? '' : 's'}, ${active ? 'active' : 'inactive'}`}
      tile={<TileText big={initials(customer.name)} color={tone.fg} />}
      title={customer.name}
      subtitle={`${phone || 'No phone'} · ${count} Booking${count === 1 ? '' : 's'}`}
      pill={active ? { label: 'ACTIVE', kind: 'success' } : { label: 'INACTIVE', kind: 'warning' }}
      trailing={
        <Touchable
          onPress={() => Linking.openURL(`tel:${phone}`)}
          disabled={!phone}
          accessibilityRole="button"
          accessibilityLabel={`Call ${customer.name}`}
          hitSlop={8}
          style={{ borderRadius: u(36) }}>
          <GlossTile from={tone.from} to={tone.to} radius={u(36)} style={{ width: u(72), height: u(72) }}>
            <Ionicons name="call" size={u(30)} color={tone.fg} />
          </GlossTile>
        </Touchable>
      }
    />
  );
}

const useSt = makeStyles(({ G }: Theme) =>
  StyleSheet.create({
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
  title: { fontFamily: F.semibold, fontSize: 25, lineHeight: 30, letterSpacing: -0.3, color: G.ink },
  subtitle: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 17, letterSpacing: 0.2, color: G.muted, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: G.buttonBorder,
    boxShadow: G.buttonGlow,
  },
  addText: { fontFamily: F.semibold, fontSize: 14, color: G.onBlue },

  search: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 46, paddingHorizontal: 18, marginBottom: 10 },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 13.5, color: G.ink, paddingVertical: 0, height: '100%' },

}),
);
