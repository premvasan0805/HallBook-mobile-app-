import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';

import { type MciName } from '@/components/brand-page';
import { CalendarGrid, CalendarLegend, MonthHeader, type YM } from '@/components/calendar';
import { SearchBar } from '@/components/form';
import { glassSurface, GlossTile, GradientFill, Sheen } from '@/components/glass';
import { GlassActionButton } from '@/components/glass-action';
import { GlassBackdrop, GlassCta, GlassPageHeader } from '@/components/glass-header';
import { BottomSheet, useToast } from '@/components/overlays';
import { EmptyState, ErrorState, Screen, SecondaryButton, Touchable } from '@/components/primitives';
import { CustomerFormSheet } from '@/components/sheets';
import { Avatar } from '@/components/status';
import { fmtLong, inr, parseISO, toNum, todayISO } from '@/lib/format';
import {
  CATEGORY_LABEL,
  GST_RATE,
  paidOf,
  SLOT_LABEL,
  SLOT_ORDER,
  SLOT_SEGMENTS,
  slotTime,
  totalFromSplit,
  useStore,
  type BookingStatus,
  type SlotKey,
} from '@/lib/store';
import { F, noOutline, radius, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

type IonName = ComponentProps<typeof Ionicons>['name'];

/** Theme tile tone behind each icon-tile name used on this screen. */
const TILE = {
  blue: 'blue',
  lilac: 'violet',
  mint: 'mint',
  sun: 'sand',
  rose: 'rose',
  sky: 'blue',
} as const;
type Tone = keyof typeof TILE;

/** Event-type chips: tinted pills; unknown (user-added) types fall back to the primary blue. */
const EVENT_ICON: Record<string, { icon: MciName; tone: Tone }> = {
  Wedding: { icon: 'ring', tone: 'sun' },
  Engagement: { icon: 'account-multiple-outline', tone: 'mint' },
  Party: { icon: 'glass-wine', tone: 'lilac' },
  'Family Function': { icon: 'cake-variant-outline', tone: 'rose' },
  Reception: { icon: 'office-building-outline', tone: 'blue' },
  'Company Function': { icon: 'briefcase-outline', tone: 'sky' },
};
function eventMeta(t: Theme, type: string): { icon: MciName; fg: string; bg: string } {
  const e = EVENT_ICON[type];
  if (!e) return { icon: 'calendar-star', fg: t.C.primary, bg: t.C.primarySoft };
  const tone = t.tone[TILE[e.tone]];
  return { icon: e.icon, fg: tone.fg, bg: tone.to };
}

/** Sky icon and tile tone per booking slot. */
const SLOT_LOOK: Record<SlotKey, { icon: MciName; tile: Tone }> = {
  full: { icon: 'white-balance-sunny', tile: 'sun' },
  first: { icon: 'weather-sunset-up', tile: 'rose' },
  second: { icon: 'moon-waning-crescent', tile: 'lilac' },
  early: { icon: 'weather-sunset-up', tile: 'sky' },
};

const STATUS_OPTIONS: { key: Exclude<BookingStatus, 'cancelled'>; label: string; icon: IonName }[] = [
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { key: 'tentative', label: 'Tentative', icon: 'time-outline' },
  { key: 'enquiry', label: 'Enquiry', icon: 'document-text-outline' },
];

export default function BookingFormScreen() {
  const params = useLocalSearchParams<{ date?: string; customerId?: string; id?: string; slot?: SlotKey }>();
  const store = useStore();
  const toast = useToast();
  const t = useTheme();
  const st = useSt();
  const editing = params.id ? store.bookings.find((b) => b.id === params.id) : undefined;
  const today = todayISO();

  const [customerId, setCustomerId] = useState<string | null>(editing?.customerId ?? params.customerId ?? null);
  const [date, setDate] = useState<string | null>(editing?.date ?? params.date ?? null);
  const [ym, setYm] = useState<YM>(() => {
    const d = parseISO(editing?.date ?? params.date ?? today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [slot, setSlot] = useState<SlotKey | null>(editing?.slot ?? params.slot ?? null);
  const [eventType, setEventType] = useState(editing?.eventType ?? '');
  const [pickingType, setPickingType] = useState(false);
  const [newType, setNewType] = useState<string | null>(null);
  const [bride, setBride] = useState(editing?.brideName ?? '');
  const [groom, setGroom] = useState(editing?.groomName ?? '');
  const [guests, setGuests] = useState(editing?.guests ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  // null = follow the suggested price for the chosen date + slot until the user types their own.
  const [nonGst, setNonGst] = useState<string | null>(
    editing ? String(editing.nonGstAmount ?? (editing.gstAmount ? 0 : editing.total)) : null,
  );
  const [gstAmtInput, setGstAmt] = useState<string | null>(
    editing ? (editing.gstAmount ? String(editing.gstAmount) : '') : null,
  );
  const [reason, setReason] = useState(editing?.priceReason ?? '');
  const [advance, setAdvance] = useState('');
  const [status, setStatus] = useState<BookingStatus>(editing?.status ?? 'confirmed');
  const [q, setQ] = useState('');
  const [pickingDate, setPickingDate] = useState(false);
  /** Day tapped in the date sheet; only becomes the booking date on "Apply Date". */
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pickingCustomer, setPickingCustomer] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [saving, setSaving] = useState(false);

  const excludeId = editing?.id;
  const customer = customerId ? store.customerById(customerId) : undefined;
  const seg = date ? store.segmentState(date, excludeId) : null;
  const slotFree = (k: SlotKey) => !seg || SLOT_SEGMENTS[k].every((s) => seg[s] === 'free');

  // Pricing: suggested price by date category + slot; total = nonGst + gst + 18% of gst.
  const suggestedRate = date && slot ? store.rateFor(date, slot) : null;
  const suggested = date && slot ? store.priceFor(date, slot) : 0;
  const category = date ? store.categoryFor(date) : null;
  const nonGstText = nonGst ?? (suggestedRate ? String(suggestedRate.nonGst) : '');
  const gstAmt = gstAmtInput ?? (suggestedRate?.gst ? String(suggestedRate.gst) : '');
  const base = toNum(nonGstText) + toNum(gstAmt);
  const tax = Math.round(toNum(gstAmt) * GST_RATE);
  const total = totalFromSplit(toNum(nonGstText), toNum(gstAmt));
  const priceChanged =
    base > 0 && (!suggestedRate || toNum(nonGstText) !== suggestedRate.nonGst || toNum(gstAmt) !== suggestedRate.gst);
  // When editing, an untouched price that already differed from the suggestion needs no new reason.
  const originalBase = editing ? (editing.nonGstAmount ?? editing.total) + (editing.gstAmount ?? 0) : null;
  const reasonRequired = priceChanged && !(editing && base === originalBase && (editing.gstAmount ?? 0) === toNum(gstAmt));
  const alreadyPaid = editing ? paidOf(editing) : 0;
  const advanceValue = toNum(advance);

  const error = (() => {
    if (!date) return 'Pick the event date';
    if (!slot) return 'Choose a time slot';
    if (!slotFree(slot)) return `${SLOT_LABEL[slot]} is not available on this date`;
    if (!customer) return 'Select a customer';
    if (!eventType) return 'Choose an event type';
    if (total <= 0) return 'Enter the price';
    if (reasonRequired && !reason.trim()) return 'Add a reason for changing the suggested price';
    if (total < alreadyPaid) return `Total can't be less than already received (${inr(alreadyPaid)})`;
    if (advanceValue > total) return 'Advance cannot exceed the total';
    return null;
  })();

  if (params.id && !editing) {
    return (
      <Screen title="Edit Booking" back>
        <ErrorState title="Booking not found" />
      </Screen>
    );
  }

  const save = () => {
    if (saving) return;
    if (error || !customer || !date || !slot) {
      toast(error ?? 'Complete the booking details');
      return;
    }
    setSaving(true);
    const fields = {
      date,
      slot,
      eventType,
      customerId: customer.id,
      brideName: bride.trim() || undefined,
      groomName: groom.trim() || undefined,
      guests: guests.trim() || undefined,
      notes: notes.trim() || undefined,
      nonGstAmount: toNum(nonGstText),
      gstAmount: toNum(gstAmt),
      priceReason: priceChanged ? reason.trim() || undefined : undefined,
      total,
      status,
    };
    if (editing) {
      store.updateBooking(editing.id, fields);
      toast('Booking updated');
      router.back();
    } else {
      const b = store.addBooking({ ...fields, advance: advanceValue || undefined });
      toast(`Booking ${b.number} created`);
      router.replace({ pathname: '/booking/[id]', params: { id: b.id } });
    }
  };

  const addType = () => {
    const name = newType?.trim();
    if (!name) return;
    // Re-typing an existing type just selects it instead of adding a duplicate.
    const existing = store.eventTypes.find((e) => e.toLowerCase() === name.toLowerCase());
    if (!existing) store.addEventType(name);
    setEventType(existing ?? name);
    setNewType(null);
  };

  const customers = store.customers
    .filter((c) => {
      const s = q.trim().toLowerCase();
      return !s || c.name.toLowerCase().includes(s) || c.phone.includes(s);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={st.screen}>
      <GlassBackdrop />
      <GlassPageHeader lead={editing ? 'Edit' : 'New'} accent="Booking" hallIcon="bank" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Event date */}
          <View style={[st.card, st.dateCard]}>
            <Sheen radius={16} strength={0.45} />
            <Tile tone="blue" icon={<MaterialCommunityIcons name="calendar-blank-outline" size={19} color={t.G.blue} />} />
            <View style={{ flex: 1 }}>
              <Text style={st.overline}>Event Date</Text>
              <Text style={st.dateText} numberOfLines={1}>
                {date ? fmtLong(date) : 'Not selected'}
              </Text>
            </View>
            <Touchable
              onPress={() => {
                setPendingDate(date);
                setPickingDate(true);
              }}
              accessibilityRole="button"
              style={st.outlineBtn}>
              <MaterialCommunityIcons name="calendar-month-outline" size={15} color={t.G.blue} />
              <Text style={st.outlineBtnText}>{date ? 'Change Date' : 'Select Date'}</Text>
            </Touchable>
          </View>

          {/* Time slot */}
          <Section tone="lilac" icon={<Ionicons name="time-outline" size={18} color={t.G.navy} />} title="Select Time Slot">
            <View style={st.slotGrid}>
              {SLOT_ORDER.map((k) => {
                const free = slotFree(k);
                const on = slot === k;
                const m = SLOT_LOOK[k];
                const tone = t.tone[TILE[m.tile]];
                return (
                  <Touchable
                    key={k}
                    disabled={!free}
                    onPress={() => setSlot(k)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on, disabled: !free }}
                    style={[st.slot, on && st.slotOn, !free && { opacity: t.dark ? 0.55 : 0.45 }]}>
                    <Sheen radius={12} strength={0.5} height="45%" />
                    <GlossTile from={tone.from} to={tone.to} radius={9} style={st.slotIcon}>
                      <MaterialCommunityIcons name={m.icon} size={19} color={tone.fg} />
                    </GlossTile>
                    <View style={{ flex: 1 }}>
                      <Text style={st.slotTitle} numberOfLines={1}>
                        {SLOT_LABEL[k]}
                      </Text>
                      <Text style={st.slotTime} numberOfLines={1}>
                        {free ? slotTime(k, store.segments) : 'Not available'}
                      </Text>
                    </View>
                    {on ? (
                      <Ionicons name="checkmark-circle" size={15} color={t.G.blue} style={st.slotMark} />
                    ) : (
                      <View style={[st.slotMark, st.radio]} />
                    )}
                  </Touchable>
                );
              })}
            </View>
          </Section>

          {/* Customer */}
          <Section tone="lilac" icon={<Ionicons name="people-outline" size={18} color={t.tone.violet.fg} />} title="Customer" indent>
            <Touchable onPress={() => setPickingCustomer(true)} accessibilityRole="button" style={st.input}>
              {customer ? (
                <>
                  <Avatar name={customer.name} size={26} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.customerName} numberOfLines={1}>
                      {customer.name}
                    </Text>
                    <Text style={st.customerPhone}>{customer.phone || 'No phone'}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="person-outline" size={16} color={t.G.blue} />
                  <Text style={[st.customerName, { flex: 1 }]}>Select or add customer</Text>
                </>
              )}
              <Ionicons name="chevron-forward" size={15} color={t.G.ink} />
            </Touchable>
          </Section>

          {/* Event details */}
          <Section tone="blue" icon={<Ionicons name="document-text-outline" size={18} color={t.G.blue} />} title="Event Details" indent>
            <View style={{ gap: 9 }}>
              <View style={{ gap: 5 }}>
                <Text style={st.label}>
                  Event type <Text style={{ color: t.C.danger }}>*</Text>
                </Text>
                <Touchable
                  onPress={() => setPickingType((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={eventType ? `Event type: ${eventType}` : 'Select event type'}
                  accessibilityState={{ expanded: pickingType }}
                  style={[st.input, pickingType && st.inputFocus]}>
                  <MaterialCommunityIcons
                    name={eventType ? eventMeta(t, eventType).icon : 'ring'}
                    size={17}
                    color={t.G.blue}
                  />
                  <Text style={st.selectText} numberOfLines={1}>
                    {eventType || 'Select event type'}
                  </Text>
                  <Ionicons name={pickingType ? 'chevron-up' : 'chevron-down'} size={15} color={t.G.ink} />
                </Touchable>
                {pickingType ? (
                  <View style={st.menu}>
                    {store.eventTypes.map((type) => {
                      const m = eventMeta(t, type);
                      const on = eventType === type;
                      return (
                        <Touchable
                          key={type}
                          onPress={() => {
                            setEventType(type);
                            setPickingType(false);
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: on }}
                          style={[st.menuItem, on && { backgroundColor: t.G.soft }]}>
                          <View style={[st.typeIcon, { backgroundColor: m.bg }]}>
                            <MaterialCommunityIcons name={m.icon} size={14} color={m.fg} />
                          </View>
                          <Text style={[st.menuText, on && { fontFamily: F.semibold, color: t.G.blue }]}>{type}</Text>
                          {on ? <Ionicons name="checkmark" size={16} color={t.G.blue} /> : null}
                        </Touchable>
                      );
                    })}
                    <Touchable
                      onPress={() => {
                        setPickingType(false);
                        setNewType('');
                      }}
                      accessibilityRole="button"
                      style={[st.menuItem, st.menuAdd]}>
                      <Ionicons name="add" size={16} color={t.G.blue} />
                      <Text style={[st.menuText, { fontFamily: F.semibold, color: t.G.blue }]}>Add new event type</Text>
                    </Touchable>
                  </View>
                ) : null}
              </View>
              {newType !== null ? (
                <View style={{ gap: 10 }}>
                  <Field
                    label="New event type"
                    placeholder="Baby Shower, Sangeet..."
                    autoFocus
                    autoCapitalize="words"
                    returnKeyType="done"
                    value={newType}
                    onChangeText={setNewType}
                    onSubmitEditing={addType}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Touchable onPress={() => setNewType(null)} accessibilityRole="button" style={[st.formBtn, st.formBtnGhost]}>
                      <Text style={[st.formBtnText, { color: t.G.blue }]}>Cancel</Text>
                    </Touchable>
                    <Touchable
                      onPress={addType}
                      disabled={!newType.trim()}
                      accessibilityRole="button"
                      style={[st.formBtn, st.formBtnOn]}>
                      <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={9} />
                      <Text style={[st.formBtnText, { color: t.G.onBlue }]}>Add</Text>
                    </Touchable>
                  </View>
                </View>
              ) : null}
              <Field label="Bride's name (optional)" icon="person-outline" placeholder="Enter bride's name" value={bride} onChangeText={setBride} />
              <Field label="Groom's name (optional)" icon="person-outline" placeholder="Enter groom's name" value={groom} onChangeText={setGroom} />
              <Field
                label="Expected guests (optional)"
                icon="people-outline"
                placeholder="Enter expected number of guests"
                keyboardType="number-pad"
                value={guests}
                onChangeText={setGuests}
              />
              <Field label="Notes (optional)" icon="document-text-outline" placeholder="Add any additional notes..." multiline value={notes} onChangeText={setNotes} />
            </View>
          </Section>

          {/* Price */}
          <View style={[st.card, { gap: 10 }]}>
            <Sheen radius={16} strength={0.45} height="25%" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <SectionHead tone="mint" icon={<MaterialCommunityIcons name="currency-inr" size={18} color={t.tone.mint.fg} />} title="Price" rule />
                {suggested ? (
                  <Touchable
                    onPress={() => {
                      setNonGst(null);
                      setGstAmt(null);
                    }}
                    accessibilityLabel="Use suggested price"
                    style={st.suggestRow}>
                    <Text style={st.suggestLabel}>Suggested:</Text>
                    <Text style={st.suggestAmt}>{inr(suggested)}</Text>
                    {category ? <Text style={st.suggestCat}>({CATEGORY_LABEL[category].toUpperCase()})</Text> : null}
                  </Touchable>
                ) : (
                  <Text style={st.hint}>Pick a date and time slot to see the suggested price</Text>
                )}
              </View>
              <View style={st.totalBox}>
                <Text style={st.totalAmt} numberOfLines={1} adjustsFontSizeToFit>
                  {inr(total)}
                </Text>
                <Text style={st.totalLabel}>Estimated total</Text>
              </View>
            </View>
            <Field label="Non-GST amount" prefix="₹" placeholder="0" keyboardType="number-pad" value={nonGstText} onChangeText={setNonGst} />
            <Field
              label={`GST amount (${GST_RATE * 100}% tax applies)`}
              prefix="₹"
              placeholder="0"
              keyboardType="number-pad"
              value={gstAmt}
              onChangeText={setGstAmt}
            />
            <View style={st.gstRow}>
              <Text style={st.gstText}>
                GST {GST_RATE * 100}% on {inr(toNum(gstAmt))}
              </Text>
              <Text style={st.gstAmt}>{inr(tax)}</Text>
            </View>
            <Field
              label={reasonRequired || !priceChanged ? 'Reason for changing suggested price' : 'Price note (optional)'}
              icon="document-text-outline"
              placeholder="Required when price is changed"
              value={reason}
              onChangeText={setReason}
            />
          </View>

          {/* Advance */}
          <View style={[st.card, { gap: 10 }]}>
            <Sheen radius={16} strength={0.45} height="40%" />
            <SectionHead tone="sun" icon={<MaterialCommunityIcons name="hand-coin-outline" size={18} color={t.tone.sand.fg} />} title="Advance (Optional)" rule />
            {editing ? (
              <Text style={st.hint}>
                {inr(alreadyPaid)} already received. Record further payments from the booking details screen.
              </Text>
            ) : (
              <Field
                label="Advance amount"
                prefix="₹"
                placeholder="0"
                keyboardType="number-pad"
                value={advance}
                onChangeText={setAdvance}
                error={advanceValue > total ? `Cannot exceed total ${inr(total)}` : undefined}
              />
            )}
          </View>

          {/* Booking status */}
          <View style={[st.card, { gap: 10 }]}>
            <Sheen radius={16} strength={0.45} height="40%" />
            <SectionHead tone="rose" icon={<Ionicons name="bookmark-outline" size={17} color={t.tone.rose.fg} />} title="Booking Status" rule />
            <View style={st.segment}>
              {STATUS_OPTIONS.map((o, i) => {
                const on = status === o.key;
                return (
                  <View key={o.key} style={{ flex: 1, flexDirection: 'row' }}>
                    {i > 0 && !on && status !== STATUS_OPTIONS[i - 1].key ? <View style={st.segSep} /> : null}
                    <Touchable
                      onPress={() => setStatus(o.key)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      style={[st.segItem, on && st.segOn]}>
                      {on ? <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={9} horizontal /> : null}
                      {on ? <Sheen radius={9} strength={0.4} height="50%" /> : null}
                      <Ionicons name={o.icon} size={15} color={on ? t.G.onBlue : t.G.ink} />
                      <Text style={[st.segText, on && { color: t.G.onBlue, fontFamily: F.semibold }]}>{o.label}</Text>
                    </Touchable>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <GlassCta
          title={editing ? 'Save Changes' : 'Create Booking'}
          icon={<MaterialCommunityIcons name="calendar-check-outline" size={20} color={t.G.onBlue} />}
          onPress={save}
          disabled={saving}
        />
      </KeyboardAvoidingView>

      {/* Date picker */}
      <BottomSheet
        visible={pickingDate}
        onClose={() => setPickingDate(false)}
        header={
          <>
            <GlossTile from={t.tone.blue.from} to={t.tone.blue.to} radius={12} style={st.sheetTile}>
              <Ionicons name="calendar-clear-outline" size={21} color={t.G.blue} />
            </GlossTile>
            <View style={{ flex: 1 }}>
              <Text style={st.sheetTitle}>
                Select <Text style={{ color: t.G.blue }}>event date</Text>
              </Text>
              <Text style={st.sheetSub}>Fully booked and blocked days can&apos;t be selected.</Text>
            </View>
          </>
        }
        footer={
          <GlassActionButton
            title="Apply Date"
            icon="calendar"
            height={56}
            onPress={() => {
              if (!pendingDate) return;
              setDate(pendingDate);
              if (slot && !SLOT_SEGMENTS[slot].every((s) => store.segmentState(pendingDate, excludeId)[s] === 'free')) setSlot(null);
              setPickingDate(false);
            }}
            disabled={!pendingDate}
          />
        }>
        <View style={{ paddingHorizontal: 2 }}>
          <MonthHeader ym={ym} onChange={setYm} boxed />
          <CalendarGrid
            boxed
            ym={ym}
            selected={pendingDate}
            excludeId={excludeId}
            onSelect={setPendingDate}
            isDisabled={(iso) =>
              (iso < today && iso !== editing?.date) ||
              Object.values(store.segmentState(iso, excludeId)).every((s) => s !== 'free')
            }
          />
          <CalendarLegend boxed />
        </View>
      </BottomSheet>

      {/* Customer picker */}
      <BottomSheet visible={pickingCustomer} onClose={() => setPickingCustomer(false)} title="Select customer">
        <SearchBar value={q} onChangeText={setQ} placeholder="Search by name or phone" />
        <SecondaryButton
          title="Add new customer"
          icon="person-add-outline"
          onPress={() => {
            setPickingCustomer(false);
            setAddingCustomer(true);
          }}
        />
        {customers.length === 0 ? (
          <EmptyState icon="search-outline" title="No customers found" />
        ) : (
          customers.map((c) => (
            <Touchable
              key={c.id}
              onPress={() => {
                setCustomerId(c.id);
                setPickingCustomer(false);
              }}
              style={[st.pickRow, customerId === c.id && st.pickRowOn]}>
              <Avatar name={c.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={t.T.cardTitle}>{c.name}</Text>
                <Text style={t.T.secondary}>{c.phone || 'No phone'}</Text>
              </View>
              <Ionicons
                name={customerId === c.id ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={customerId === c.id ? t.C.primary : t.C.borderStrong}
              />
            </Touchable>
          ))
        )}
      </BottomSheet>
      <CustomerFormSheet visible={addingCustomer} onClose={() => setAddingCustomer(false)} onSaved={(c) => setCustomerId(c.id)} />
    </View>
  );
}

/** Glossy pastel square behind a section icon. */
function Tile({ icon, tone }: { icon: ReactNode; tone: Tone }) {
  const t = useTheme();
  const st = useSt();
  const g = t.tone[TILE[tone]];
  return (
    <GlossTile from={g.from} to={g.to} radius={10} style={st.tile}>
      {icon}
    </GlossTile>
  );
}

function SectionHead({ icon, tone, title, rule }: { icon: ReactNode; tone: Tone; title: string; rule?: boolean }) {
  const t = useTheme();
  const st = useSt();
  return (
    <View style={st.head}>
      <Tile icon={icon} tone={tone} />
      <Text style={st.overline}>{title}</Text>
      {rule ? (
        <Svg width={56} height={8} viewBox="0 0 56 8" pointerEvents="none">
          <Path d="M0 4H48" stroke={t.G.blue} strokeWidth={1} strokeOpacity={0.85} />
          <Path d="M51.5 1L54.5 4L51.5 7L48.5 4Z" stroke={t.G.blue} strokeWidth={1} fill={t.surface} />
        </Svg>
      ) : null}
    </View>
  );
}

/** Frosted section card: icon tile + overline label, then content (optionally indented under the label). */
function Section({
  icon,
  tone,
  title,
  indent,
  children,
}: {
  icon: ReactNode;
  tone: Tone;
  title: string;
  indent?: boolean;
  children: ReactNode;
}) {
  const st = useSt();
  return (
    <View style={[st.card, { gap: indent ? 4 : 10 }]}>
      <Sheen radius={16} strength={0.45} height="30%" />
      <SectionHead icon={icon} tone={tone} title={title} />
      <View style={indent ? { paddingLeft: 47 } : null}>{children}</View>
    </View>
  );
}

function Field({
  label,
  icon,
  prefix,
  error,
  multiline,
  ...props
}: TextInputProps & { label: string; icon?: IonName; prefix?: string; error?: string }) {
  const t = useTheme();
  const st = useSt();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 5 }}>
      <Text style={st.label}>{label}</Text>
      <View style={[st.input, focus && st.inputFocus, !!error && { borderColor: t.C.danger }]}>
        {icon ? <Ionicons name={icon} size={16} color={t.G.blue} /> : null}
        {prefix ? <Text style={st.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={t.G.placeholder}
          multiline={multiline}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={st.inputText}
          {...props}
        />
      </View>
      {error ? <Text style={[t.T.caption, { color: t.C.danger }]}>{error}</Text> : null}
    </View>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.backgroundAlt },
    body: { paddingHorizontal: 18, paddingTop: 16, gap: 11, paddingBottom: 16 },
    card: { ...glassSurface(t, t.frost(0.5), 16), padding: 10 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    tile: { width: 36, height: 36 },
    sheetTile: { width: 42, height: 42, alignSelf: 'flex-start', marginTop: 2 },
    overline: {
      fontFamily: F.medium,
      fontSize: 10.5,
      lineHeight: 14,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: t.G.navy,
    },
    label: { fontFamily: F.medium, fontSize: 12, lineHeight: 16, color: t.G.ink },
    hint: { fontFamily: F.regular, fontSize: 11, lineHeight: 15, color: t.G.muted },

    dateCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    dateText: { fontFamily: F.semibold, fontSize: 15.5, lineHeight: 20, letterSpacing: -0.2, color: t.G.ink },
    outlineBtn: {
      ...glassSurface(t, t.frost(0.85), 10),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 10,
      borderColor: t.G.focusBorder,
      borderWidth: 1,
    },
    outlineBtnText: { fontFamily: F.medium, fontSize: 11.5, color: t.G.blue },

    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    slot: {
      ...glassSurface(t, t.frost(0.58), 12),
      width: '48%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      height: 48,
      paddingHorizontal: 6,
    },
    slotOn: {
      borderColor: t.primary,
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 0px 0px 3px rgba(214, 170, 69, 0.16), 0px 8px 20px ${t.shadow}`
        : `inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 0px 0px 3px rgba(198, 146, 36, 0.12), 0px 6px 14px ${t.shadow}`,
    },
    slotIcon: { width: 34, height: 34 },
    slotTitle: { fontFamily: F.medium, fontSize: 12, lineHeight: 16, color: t.G.ink },
    slotTime: { fontFamily: F.regular, fontSize: 10.5, lineHeight: 14, color: t.G.muted },
    slotMark: { position: 'absolute', top: 6, right: 7 },
    radio: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.2, borderColor: t.textMuted },

    customerName: { fontFamily: F.medium, fontSize: 13, lineHeight: 17, color: t.G.ink },
    customerPhone: { fontFamily: F.regular, fontSize: 11, lineHeight: 15, color: t.G.muted },

    selectText: { flex: 1, fontFamily: F.regular, fontSize: 13, color: t.G.ink },
    typeIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    menu: {
      ...glassSurface(t, t.frost(0.9), 10),
      marginTop: 2,
      paddingVertical: 3,
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 38, paddingHorizontal: 10 },
    menuText: { flex: 1, fontFamily: F.regular, fontSize: 13, color: t.G.ink },
    menuAdd: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.G.rule, marginTop: 3 },
    sheetTitle: { fontFamily: F.semibold, fontSize: 22, lineHeight: 27, letterSpacing: -0.3, color: t.G.ink },
    sheetSub: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 16, color: t.G.navy, marginTop: 1 },
    formBtn: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    formBtnGhost: { ...glassSurface(t, t.frost(0.8), 10), borderColor: t.G.focusBorder, borderWidth: 1 },
    formBtnOn: { borderWidth: 1, borderColor: t.G.buttonBorder, boxShadow: t.G.buttonGlow },
    formBtnText: { fontFamily: F.semibold, fontSize: 13.5 },

    /** Frosted input surface shared by fields, the event-type select and the customer picker. */
    input: {
      ...glassSurface(t, t.frost(0.62), 10),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 38,
      paddingHorizontal: 13,
    },
    inputFocus: {
      borderColor: t.G.focusBorder,
      boxShadow: t.G.focusGlow,
    },
    prefix: { fontFamily: F.medium, fontSize: 13, color: t.G.muted },
    inputText: { flex: 1, fontFamily: F.regular, fontSize: 13.5, color: t.G.ink, paddingVertical: 8, outlineWidth: 0, ...noOutline },

    suggestRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 },
    suggestLabel: { fontFamily: F.medium, fontSize: 11.5, color: t.G.blue },
    suggestAmt: { fontFamily: F.semibold, fontSize: 13.5, color: t.G.blue },
    suggestCat: { fontFamily: F.medium, fontSize: 10.5, color: t.G.muted },
    totalBox: {
      ...glassSurface(t, t.tint(0.8), 12),
      minWidth: 96,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    totalAmt: { fontFamily: F.semibold, fontSize: 18, lineHeight: 23, letterSpacing: -0.2, color: t.G.deep, fontVariant: ['lining-nums'] },
    totalLabel: { fontFamily: F.regular, fontSize: 10, color: t.G.muted },
    gstRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -2 },
    gstText: { fontFamily: F.regular, fontSize: 11.5, color: t.G.ink },
    gstAmt: { fontFamily: F.semibold, fontSize: 13.5, color: t.G.deep, fontVariant: ['lining-nums'] },

    segment: { ...glassSurface(t, t.frost(0.5), 12), flexDirection: 'row', padding: 2 },
    segItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      minHeight: 32,
      borderRadius: 10,
    },
    segOn: {
      borderWidth: 1,
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
    },
    segSep: { width: StyleSheet.hairlineWidth, marginVertical: 9, backgroundColor: t.G.rule },
    segText: { fontFamily: F.regular, fontSize: 11.5, color: t.G.ink },

    pickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: radius.md,
      borderWidth: 1.2,
      borderColor: t.C.border,
      backgroundColor: t.C.surface,
    },
    pickRowOn: { borderColor: t.C.primary, backgroundColor: t.C.primarySoft },
  }),
);
