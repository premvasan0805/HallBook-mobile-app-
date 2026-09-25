import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactBrandHeader } from '@/components/brand-header';
import { BrandGradient } from '@/components/decor';
import { EmptyState, Touchable } from '@/components/primitives';
import { CustomerFormSheet } from '@/components/sheets';
import { initials, todayISO } from '@/lib/format';
import { useStore, type Customer } from '@/lib/store';
import { C, elevation, F, noOutline } from '@/lib/theme';

/** Profiles open inside this tab's stack so the tab bar stays visible. */
const openCustomer = (id: string) => router.push({ pathname: '/customers/[id]', params: { id } });

/** Pastel initials circles; picked from the name so a customer keeps their colour. */
const AVATAR = [
  { bg: '#FCE9EC', fg: '#B3263A' },
  { bg: '#FBF0E0', fg: '#8A5A2A' },
  { bg: '#EEEBFA', fg: '#3B2A8C' },
  { bg: '#E9EEFB', fg: '#2E4C9A' },
  { bg: '#E4F3E8', fg: '#226B3A' },
];

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { customers, bookings } = useStore();
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const today = todayISO();

  // Light status bar only while this tab (with its burgundy header) is on screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const countFor = (id: string) => bookings.filter((b) => b.customerId === id).length;
  const isActive = (id: string) =>
    bookings.some((b) => b.customerId === id && b.status !== 'cancelled' && b.date >= today);

  const query = q.trim().toLowerCase();
  const list = customers
    .filter((c) => !query || c.name.toLowerCase().includes(query) || c.phone.includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));

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
              <Text style={st.title}>Customers</Text>
              <Text style={st.subtitle}>Manage your customers</Text>
            </View>
            <Touchable onPress={() => setAdding(true)} accessibilityRole="button" hitSlop={6} style={st.addBtn}>
              <BrandGradient id="customersAddGrad" from={C.gradientTo} to={C.primaryDark} />
              <Ionicons name="add" size={20} color={C.onPrimary} />
              <Text style={st.addText}>Add Customer</Text>
            </Touchable>
          </View>

          <View style={st.searchRow}>
            <View style={st.search}>
              <Ionicons name="search-outline" size={20} color={C.primary} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search by name or phone number..."
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

          <View style={{ gap: 9 }}>
            {list.length === 0 ? (
              query ? (
                <EmptyState
                  icon="search-outline"
                  title="No matches"
                  message={`Nothing found for “${q}”.`}
                />
              ) : (
                <EmptyState
                  icon="people-outline"
                  title="No customers yet"
                  action="Add customer"
                  onAction={() => setAdding(true)}
                />
              )
            ) : (
              list.map((c) => <CustomerRow key={c.id} customer={c} count={countFor(c.id)} active={isActive(c.id)} />)
            )}
          </View>
        </View>
      </ScrollView>

      <CustomerFormSheet visible={adding} onClose={() => setAdding(false)} onSaved={(c) => openCustomer(c.id)} />
    </View>
  );
}

function CustomerRow({ customer, count, active }: { customer: Customer; count: number; active: boolean }) {
  const tone = AVATAR[[...customer.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR.length];
  const phone = customer.phone;

  return (
    // The whole card opens the profile; the call button sits beside it (never nested — web forbids button-in-button).
    <View style={st.row}>
      <Touchable
        onPress={() => openCustomer(customer.id)}
        accessibilityRole="button"
        accessibilityLabel={`${customer.name}, ${count} booking${count === 1 ? '' : 's'}, ${active ? 'active' : 'inactive'}`}
        style={StyleSheet.absoluteFill}>
        {null}
      </Touchable>
      <View style={[st.avatar, { backgroundColor: tone.bg }]} pointerEvents="none">
        <Text style={[st.avatarText, { color: tone.fg }]}>{initials(customer.name)}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }} pointerEvents="none">
        <Text style={st.name} numberOfLines={1}>
          {customer.name}
        </Text>
        <View style={st.metaRow}>
          <Ionicons name="call" size={13} color={META_ICON} />
          <Text style={st.phone} numberOfLines={1}>
            {phone || 'No phone'}
          </Text>
        </View>
        <View style={st.metaRow}>
          <MaterialCommunityIcons name="account-group" size={14} color={META_ICON} />
          <Text style={st.meta} numberOfLines={1}>
            {count} Booking{count === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={[st.status, active ? st.statusActive : st.statusInactive]} pointerEvents="none">
        <Ionicons
          name={active ? 'checkmark-circle-outline' : 'time-outline'}
          size={14}
          color={active ? ACTIVE_FG : INACTIVE_FG}
        />
        <Text style={[st.statusText, { color: active ? ACTIVE_FG : INACTIVE_FG }]}>{active ? 'Active' : 'Inactive'}</Text>
      </View>

      <Touchable
        onPress={() => Linking.openURL(`tel:${phone}`)}
        disabled={!phone}
        accessibilityRole="button"
        accessibilityLabel={`Call ${customer.name}`}
        hitSlop={8}
        style={st.call}>
        <Ionicons name="call" size={15} color={C.primary} />
      </Touchable>
      <Ionicons name="chevron-forward" size={17} color={C.textSecondary} pointerEvents="none" />
    </View>
  );
}

const META_ICON = '#6E5A60';
const ACTIVE_FG = '#23784A';
const INACTIVE_FG = '#9A6512';

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 14, paddingBottom: 24 },

  /** Title, search and the customer list, laid straight on the page. */
  sheet: {
    marginTop: 6,
    paddingTop: 14,
    paddingBottom: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 6, marginBottom: 10 },
  title: { fontFamily: F.serifBold, fontSize: 33, lineHeight: 37, color: C.primary },
  subtitle: { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, marginTop: -1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 15,
    borderRadius: 10,
    overflow: 'hidden',
    ...elevation,
  },
  addText: { fontFamily: F.semibold, fontSize: 13.5, color: C.onPrimary },

  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingLeft: 9,
    paddingRight: 8,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#F0E9E3',
    overflow: 'hidden',
    ...elevation,
    shadowOpacity: 0.05,
  },
  avatar: { width: 41, height: 41, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  avatarText: { fontFamily: F.semibold, fontSize: 13.5 },
  name: { fontFamily: F.semibold, fontSize: 14, lineHeight: 18, color: C.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  phone: { fontFamily: F.regular, fontSize: 12, color: '#4A4346', letterSpacing: 0.2, flexShrink: 1 },
  meta: { fontFamily: F.regular, fontSize: 11.5, color: C.textSecondary, flexShrink: 1 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 21,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  statusActive: { backgroundColor: '#E3F2E8' },
  statusInactive: { backgroundColor: '#FCEFD9' },
  statusText: { fontFamily: F.medium, fontSize: 11 },
  call: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FBEAEE',
    alignItems: 'center',
    justifyContent: 'center',
  },

});
