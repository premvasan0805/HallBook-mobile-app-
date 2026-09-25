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

import { BrandCta, BrandPageHeader, GOLD, GoldRule, SLOT_META, type MciName } from '@/components/brand-page';
import { CalendarGrid, CalendarLegend, MonthHeader, type YM } from '@/components/calendar';
import { SearchBar } from '@/components/form';
import { BottomSheet, useToast } from '@/components/overlays';
import { EmptyState, ErrorState, Screen, SecondaryButton, Touchable } from '@/components/primitives';
import { BrandGradient } from '@/components/decor';
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
import { C, elevation, F, noOutline, radius, T } from '@/lib/theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

/** Event-type chips: tinted pills; unknown (user-added) types fall back to burgundy. */
const EVENT_META: Record<string, { icon: MciName; fg: string; bg: string }> = {
  Wedding: { icon: 'ring', fg: '#A8671A', bg: '#FDF3E4' },
  Engagement: { icon: 'account-multiple-outline', fg: '#2E7D4F', bg: '#E7F2EA' },
  Party: { icon: 'glass-wine', fg: '#7B4FA6', bg: '#F0E8F7' },
  'Family Function': { icon: 'cake-variant-outline', fg: '#B3264F', bg: '#FBE9EE' },
  Reception: { icon: 'office-building-outline', fg: '#3E6A9E', bg: '#E8EEF6' },
  'Company Function': { icon: 'briefcase-outline', fg: '#1F7A7A', bg: '#E3F2F1' },
};
const EVENT_FALLBACK = { icon: 'calendar-star' as MciName, fg: C.primary, bg: C.primarySoft };

const STATUS_OPTIONS: { key: Exclude<BookingStatus, 'cancelled'>; label: string; icon: IonName }[] = [
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { key: 'tentative', label: 'Tentative', icon: 'time-outline' },
  { key: 'enquiry', label: 'Enquiry', icon: 'document-text-outline' },
];

export default function BookingFormScreen() {
  const params = useLocalSearchParams<{ date?: string; customerId?: string; id?: string; slot?: SlotKey }>();
  const store = useStore();
  const toast = useToast();
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
    const t = newType?.trim();
    if (!t) return;
    // Re-typing an existing type just selects it instead of adding a duplicate.
    const existing = store.eventTypes.find((e) => e.toLowerCase() === t.toLowerCase());
    if (!existing) store.addEventType(t);
    setEventType(existing ?? t);
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
      <BrandPageHeader title={editing ? 'Edit' : 'New'} accent="Booking" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Event date */}
          <View style={[st.card, st.dateCard]}>
            <Tile icon={<MaterialCommunityIcons name="calendar-blank-outline" size={20} color={C.primary} />} />
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
              <MaterialCommunityIcons name="calendar-month-outline" size={16} color={C.primary} />
              <Text style={st.outlineBtnText}>{date ? 'Change Date' : 'Select Date'}</Text>
            </Touchable>
          </View>

          {/* Time slot */}
          <Section icon={<Ionicons name="time-outline" size={20} color={C.primary} />} title="Select Time Slot">
            <View style={st.slotGrid}>
              {SLOT_ORDER.map((k) => {
                const free = slotFree(k);
                const on = slot === k;
                const m = SLOT_META[k];
                return (
                  <Touchable
                    key={k}
                    disabled={!free}
                    onPress={() => setSlot(k)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on, disabled: !free }}
                    style={[st.slot, on && st.slotOn, !free && { opacity: 0.45 }]}>
                    <View style={[st.slotIcon, { backgroundColor: m.bg }]}>
                      <MaterialCommunityIcons name={m.icon} size={20} color={m.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.slotTitle} numberOfLines={1}>
                        {SLOT_LABEL[k]}
                      </Text>
                      <Text style={st.slotTime} numberOfLines={1}>
                        {free ? slotTime(k, store.segments) : 'Not available'}
                      </Text>
                    </View>
                    {on ? (
                      <Ionicons name="checkmark-circle" size={18} color={C.primary} style={st.slotMark} />
                    ) : (
                      <View style={[st.slotMark, st.radio]} />
                    )}
                  </Touchable>
                );
              })}
            </View>
          </Section>

          {/* Customer */}
          <Section icon={<Ionicons name="people-outline" size={20} color={C.primary} />} title="Customer" indent>
            <Touchable onPress={() => setPickingCustomer(true)} accessibilityRole="button" style={st.customerBtn}>
              {customer ? (
                <>
                  <Avatar name={customer.name} size={30} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.customerName} numberOfLines={1}>
                      {customer.name}
                    </Text>
                    <Text style={T.caption}>{customer.phone || 'No phone'}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="person-outline" size={18} color={C.primary} />
                  <Text style={[st.customerName, { flex: 1 }]}>Select or add customer</Text>
                </>
              )}
              <Ionicons name="chevron-forward" size={18} color={C.primary} />
            </Touchable>
          </Section>

          {/* Event details */}
          <Section icon={<MaterialCommunityIcons name="note-text-outline" size={20} color={C.primary} />} title="Event Details" indent>
            <View style={{ gap: 12 }}>
              <View style={{ gap: 6 }}>
                <Text style={st.label}>
                  Event type <Text style={{ color: C.danger }}>*</Text>
                </Text>
                <Touchable
                  onPress={() => setPickingType((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={eventType ? `Event type: ${eventType}` : 'Select event type'}
                  accessibilityState={{ expanded: pickingType }}
                  style={[st.select, pickingType && { borderColor: C.primary }]}>
                  <MaterialCommunityIcons
                    name={eventType ? (EVENT_META[eventType] ?? EVENT_FALLBACK).icon : 'ring'}
                    size={20}
                    color={C.primary}
                  />
                  <Text style={st.selectText} numberOfLines={1}>
                    {eventType || 'Select event type'}
                  </Text>
                  <Ionicons name={pickingType ? 'chevron-up' : 'chevron-down'} size={18} color={C.text} />
                </Touchable>
                {pickingType ? (
                  <View style={st.menu}>
                    {store.eventTypes.map((t) => {
                      const m = EVENT_META[t] ?? EVENT_FALLBACK;
                      const on = eventType === t;
                      return (
                        <Touchable
                          key={t}
                          onPress={() => {
                            setEventType(t);
                            setPickingType(false);
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: on }}
                          style={[st.menuItem, on && { backgroundColor: C.primarySoft }]}>
                          <View style={[st.typeIcon, { backgroundColor: m.bg }]}>
                            <MaterialCommunityIcons name={m.icon} size={16} color={m.fg} />
                          </View>
                          <Text style={[st.menuText, on && { fontFamily: F.semibold, color: C.primary }]}>{t}</Text>
                          {on ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
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
                      <Ionicons name="add" size={18} color={C.primary} />
                      <Text style={[st.menuText, { fontFamily: F.semibold, color: C.primary }]}>Add new event type</Text>
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
                      <Text style={[st.formBtnText, { color: C.primary }]}>Cancel</Text>
                    </Touchable>
                    <Touchable
                      onPress={addType}
                      disabled={!newType.trim()}
                      accessibilityRole="button"
                      style={[st.formBtn, { backgroundColor: C.primary }]}>
                      <Text style={[st.formBtnText, { color: C.onPrimary }]}>Add</Text>
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
          <View style={[st.card, { gap: 12 }]}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <SectionHead icon={<MaterialCommunityIcons name="currency-inr" size={20} color={C.primary} />} title="Price" rule />
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
                  <Text style={T.caption}>Pick a date and time slot to see the suggested price</Text>
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
          <View style={[st.card, { gap: 12 }]}>
            <SectionHead icon={<MaterialCommunityIcons name="hand-coin-outline" size={20} color={C.primary} />} title="Advance (Optional)" rule />
            {editing ? (
              <Text style={T.secondary}>
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
          <View style={[st.card, { gap: 12 }]}>
            <SectionHead icon={<Ionicons name="bookmark-outline" size={19} color={C.primary} />} title="Booking Status" rule />
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
                      <Ionicons name={o.icon} size={17} color={on ? C.onPrimary : C.text} />
                      <Text style={[st.segText, on && { color: C.onPrimary, fontFamily: F.semibold }]}>{o.label}</Text>
                    </Touchable>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <BrandCta
          title={editing ? 'Save Changes' : 'Create Booking'}
          icon="calendar-check-outline"
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
            <View style={st.tile}>
              <Ionicons name="calendar-clear-outline" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.sheetTitle}>
                Select <Text style={{ color: GOLD }}>event date</Text>
              </Text>
              <Text style={st.sheetSub}>Fully booked and blocked days can&apos;t be selected.</Text>
            </View>
          </>
        }
        footer={
          <Touchable
            onPress={() => {
              if (!pendingDate) return;
              setDate(pendingDate);
              if (slot && !SLOT_SEGMENTS[slot].every((s) => store.segmentState(pendingDate, excludeId)[s] === 'free')) setSlot(null);
              setPickingDate(false);
            }}
            disabled={!pendingDate}
            accessibilityRole="button"
            style={st.applyBtn}>
            <BrandGradient id="applyDateGrad" from="#9A2244" to="#6A0B2D" />
            <Text style={st.applyText}>Apply Date</Text>
          </Touchable>
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
                <Text style={T.cardTitle}>{c.name}</Text>
                <Text style={T.secondary}>{c.phone || 'No phone'}</Text>
              </View>
              <Ionicons
                name={customerId === c.id ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={customerId === c.id ? C.primary : C.borderStrong}
              />
            </Touchable>
          ))
        )}
      </BottomSheet>
      <CustomerFormSheet visible={addingCustomer} onClose={() => setAddingCustomer(false)} onSaved={(c) => setCustomerId(c.id)} />
    </View>
  );
}

function Tile({ icon }: { icon: ReactNode }) {
  return <View style={st.tile}>{icon}</View>;
}

function SectionHead({ icon, title, rule }: { icon: ReactNode; title: string; rule?: boolean }) {
  return (
    <View style={st.head}>
      <Tile icon={icon} />
      <Text style={st.overline}>{title}</Text>
      {rule ? <GoldRule /> : null}
    </View>
  );
}

/** White section card: icon tile + label, then content (optionally indented under the label). */
function Section({ icon, title, indent, children }: { icon: ReactNode; title: string; indent?: boolean; children: ReactNode }) {
  return (
    <View style={[st.card, { gap: indent ? 6 : 12 }]}>
      <SectionHead icon={icon} title={title} />
      <View style={indent ? { paddingLeft: 48 } : null}>{children}</View>
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
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.label}>{label}</Text>
      <View style={[st.input, focus && { borderColor: C.primary }, !!error && { borderColor: C.danger }]}>
        {icon ? <Ionicons name={icon} size={17} color={C.primary} /> : null}
        {prefix ? <Text style={st.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={C.textMuted}
          multiline={multiline}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={st.inputText}
          {...props}
        />
      </View>
      {error ? <Text style={[T.caption, { color: C.danger }]}>{error}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  body: { padding: 14, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: C.surface, borderRadius: radius.md, padding: 12, ...elevation },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overline: { ...T.overline, fontSize: 11, color: '#5E5659', letterSpacing: 0.8 },
  label: { fontFamily: F.semibold, fontSize: 13, lineHeight: 18, color: C.text },

  dateCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { fontFamily: F.bold, fontSize: 17, lineHeight: 23, color: C.text },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: C.primary,
  },
  outlineBtnText: { fontFamily: F.semibold, fontSize: 12.5, color: C.primary },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    width: '48.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  slotOn: { borderColor: C.primary, borderWidth: 1.4, backgroundColor: C.primarySoft },
  slotIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  slotTitle: { fontFamily: F.semibold, fontSize: 13.5, lineHeight: 18, color: C.text },
  slotTime: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 16, color: C.textSecondary },
  slotMark: { position: 'absolute', top: 8, right: 8 },
  radio: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.4, borderColor: C.borderStrong },

  customerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: C.primary,
    backgroundColor: C.surface,
  },
  customerName: { fontFamily: F.medium, fontSize: 13.5, color: C.text },

  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#DDB3BF',
    backgroundColor: '#FFFBFB',
  },
  selectText: { flex: 1, fontFamily: F.medium, fontSize: 13.5, color: C.text },
  typeIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menu: {
    marginTop: 2,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    boxShadow: '0px 6px 16px rgba(87, 21, 44, 0.12)',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 10 },
  menuText: { flex: 1, fontFamily: F.medium, fontSize: 13.5, color: C.text },
  menuAdd: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
  sheetTitle: { fontFamily: F.pageSerifBold, fontSize: 21, lineHeight: 26, color: C.primary },
  sheetSub: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 16, color: C.textSecondary, marginTop: 1 },
  applyBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0px 4px 10px rgba(87, 21, 44, 0.25)',
  },
  applyText: { fontFamily: F.pageSerifBold, fontSize: 17, color: C.onPrimary },
  formBtn: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formBtnGhost: { borderWidth: 1.2, borderColor: C.primary, backgroundColor: C.surface },
  formBtnText: { fontFamily: F.semibold, fontSize: 14 },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  prefix: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
  inputText: { flex: 1, fontFamily: F.regular, fontSize: 13.5, color: C.text, paddingVertical: 10, outlineWidth: 0, ...noOutline },

  suggestRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 },
  suggestLabel: { fontFamily: F.medium, fontSize: 12.5, color: C.primary },
  suggestAmt: { fontFamily: F.bold, fontSize: 15, color: C.primary },
  suggestCat: { fontFamily: F.medium, fontSize: 12, color: C.textSecondary },
  totalBox: {
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8C9A0',
    backgroundColor: '#FFF9F0',
  },
  totalAmt: { fontFamily: F.serifBold, fontSize: 26, lineHeight: 30, color: C.primary, fontVariant: ['lining-nums'] },
  totalLabel: { fontFamily: F.regular, fontSize: 11, color: C.textSecondary },
  gstRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 },
  gstText: { fontFamily: F.regular, fontSize: 12.5, color: C.text },
  gstAmt: { fontFamily: F.serifBold, fontSize: 18, color: C.primary, fontVariant: ['lining-nums'] },

  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBDCCB',
    backgroundColor: '#FBF6EF',
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: 9,
    overflow: 'hidden',
  },
  segOn: { backgroundColor: C.primary, borderWidth: 1.2, borderColor: GOLD },
  segSep: { width: 1, marginVertical: 10, backgroundColor: C.border },
  segText: { fontFamily: F.medium, fontSize: 12.5, color: C.text },

  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  pickRowOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
});
