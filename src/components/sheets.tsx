import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Chip, OptionCard, TextField } from '@/components/form';
import { glassSurface, GlossTile, Sheen } from '@/components/glass';
import { BottomSheet, useToast } from '@/components/overlays';
import { PrimaryButton } from '@/components/primitives';
import { fmtLong, inr, parseISO, toNum, todayISO } from '@/lib/format';
import { balanceOf, paidOf, useStore, type Booking, type Customer } from '@/lib/store';
import { F, G } from '@/lib/theme';

const METHODS = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Cheque'];

/** UPI mark: the orange and green arrowheads. */
function UpiMark() {
  return (
    <Svg width={14} height={18} viewBox="0 0 14 18">
      <Path d="M1 1L8 9L1 17Z" fill="#F07A1A" />
      <Path d="M6 1L13 9L6 17Z" fill="#149147" />
    </Svg>
  );
}

const METHOD_GLYPH: Record<string, (on: boolean) => ReactNode> = {
  Cash: (on) => <MaterialCommunityIcons name="cash" size={20} color={on ? '#FFFFFF' : G.navy} />,
  UPI: () => <UpiMark />,
  Card: (on) => <Ionicons name="card-outline" size={18} color={on ? '#FFFFFF' : G.navy} />,
  'Bank transfer': (on) => <MaterialCommunityIcons name="bank-outline" size={19} color={on ? '#FFFFFF' : G.navy} />,
  Cheque: (on) => <MaterialCommunityIcons name="checkbook" size={19} color={on ? '#FFFFFF' : G.navy} />,
};

/** One cell of the payment summary: glossy tinted disc, label and amount. */
function SummaryCell({
  icon,
  tone,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  tone: { from: string; to: string };
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={st.cell}>
      <GlossTile from={tone.from} to={tone.to} radius={15} style={st.cellIcon}>
        {icon}
      </GlossTile>
      <View style={{ flex: 1, minWidth: 0, paddingTop: 5 }}>
        <Text style={st.cellLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[st.cellValue, { color }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit>
          {inr(value)}
        </Text>
      </View>
    </View>
  );
}
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Record Payment — validates against the remaining due so totals can never go negative. */
export function RecordPaymentSheet({
  booking,
  visible,
  onClose,
}: {
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { addPayment } = useStore();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!booking) return null;
  const due = balanceOf(booking);
  const value = toNum(amount);
  const dateOk = ISO_RE.test(date) && !isNaN(parseISO(date).getTime());
  const amountError = value > due ? `Cannot exceed remaining due of ${inr(due)}` : undefined;
  const valid = value > 0 && !amountError && dateOk;

  const reset = () => {
    setAmount('');
    setDate(todayISO());
    setMethod('Cash');
    setReference('');
    setNotes('');
    setSaving(false);
  };

  const save = () => {
    if (!valid || saving) return; // guard against double taps creating duplicate payments
    setSaving(true);
    addPayment(booking.id, {
      amount: value,
      date,
      mode: method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    toast(`Payment of ${inr(value)} recorded`);
    reset();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Record Payment"
      subtitle={booking.number}
      footer={<PrimaryButton title="Save Payment" icon="checkmark" disabled={!valid} loading={saving} onPress={save} />}>
      <View style={[st.summary, glassSurface('rgba(255, 255, 255, 0.55)', 16)]}>
        <Sheen radius={16} strength={0.5} />
        <SummaryCell
          icon={<Ionicons name="document-text-outline" size={17} color={G.blue} />}
          tone={{ from: '#F4F8FF', to: '#D6E4FA' }}
          label="Booking total"
          value={booking.total}
          color={G.ink}
        />
        <View style={st.sep} />
        <SummaryCell
          icon={<Ionicons name="checkmark-circle" size={20} color="#138A55" />}
          tone={{ from: '#F0FBF5', to: '#C9EEDB' }}
          label="Received"
          value={paidOf(booking)}
          color="#138A55"
        />
        <View style={st.sep} />
        <SummaryCell
          icon={<MaterialCommunityIcons name="wallet-outline" size={18} color="#B0612A" />}
          tone={{ from: '#FFF6EE', to: '#F8DEC8' }}
          label="Remaining"
          value={due}
          color="#A8650F"
        />
      </View>
      <TextField
        label="Amount received"
        prefix="₹"
        keyboardType="number-pad"
        placeholder="0"
        value={amount}
        onChangeText={setAmount}
        error={amountError}
        hint={due > 0 ? `Tap “Full due” to fill ${inr(due)}` : undefined}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={st.quick}>
          <Chip label="Full due" highlight onPress={() => setAmount(String(due))} />
        </View>
        <View style={st.quick}>
          <Chip label="Half" onPress={() => setAmount(String(Math.round(due / 2)))} />
        </View>
      </View>
      <TextField
        label="Payment date"
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        icon={<MaterialCommunityIcons name="calendar-month-outline" size={20} color={G.navy} />}
        right={<MaterialCommunityIcons name="calendar-blank-outline" size={19} color={G.muted} />}
        error={date && !dateOk ? 'Use YYYY-MM-DD' : undefined}
      />
      <View style={{ gap: 8 }}>
        <Text style={st.label}>Payment method</Text>
        <View style={st.wrap}>
          {METHODS.map((m) => (
            <Chip key={m} label={m} glyph={METHOD_GLYPH[m]} active={method === m} onPress={() => setMethod(m)} />
          ))}
        </View>
      </View>
      <TextField
        label="Reference number (optional)"
        placeholder="UPI / cheque / txn no."
        value={reference}
        onChangeText={setReference}
        icon={<Ionicons name="document-text-outline" size={19} color={G.navy} />}
      />
      <TextField
        label="Notes (optional)"
        placeholder="Add notes (optional)"
        multiline
        value={notes}
        onChangeText={setNotes}
        icon={<Ionicons name="document-text-outline" size={19} color={G.navy} />}
      />
    </BottomSheet>
  );
}

/** Pick which booking to pay against (used from the customer profile). */
export function PickBookingSheet({
  bookings,
  visible,
  onClose,
  onPick,
}: {
  bookings: Booking[];
  visible: boolean;
  onClose: () => void;
  onPick: (b: Booking) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select booking" subtitle="Bookings with an amount due">
      {bookings.map((b) => (
        <OptionCard action
          key={b.id}
          icon="receipt-outline"
          title={`${b.eventType} · ${fmtLong(b.date)}`}
          subtitle={`${b.number} · due ${inr(balanceOf(b))}`}
          onPress={() => onPick(b)}
        />
      ))}
    </BottomSheet>
  );
}

export function CustomerFormSheet({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved?: (c: Customer) => void;
}) {
  const { addCustomer, customers } = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const digits = phone.replace(/\D/g, '');
  const phoneError = digits && digits.length !== 10 ? 'Enter a 10-digit mobile number' : undefined;
  const dup = digits.length === 10 && customers.some((c) => c.phone === digits);
  const valid = name.trim().length > 1 && !phoneError && !dup;

  const close = () => {
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title="New customer"
      footer={
        <PrimaryButton
          title="Save Customer"
          disabled={!valid}
          onPress={() => {
            const c = addCustomer({ name: name.trim(), phone: digits });
            toast(`${c.name} added`);
            onSaved?.(c);
            close();
          }}
        />
      }>
      <TextField label="Full name" placeholder="e.g. Arun Kumar" value={name} onChangeText={setName} autoFocus />
      <TextField
        label="Mobile number"
        placeholder="10-digit number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={phoneError ?? (dup ? 'A customer with this number already exists' : undefined)}
      />
    </BottomSheet>
  );
}

const st = StyleSheet.create({
  summary: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8 },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4 },
  cellIcon: { width: 30, height: 30 },
  cellLabel: { fontFamily: F.regular, fontSize: 11, lineHeight: 14, color: G.ink },
  cellValue: { fontFamily: F.bold, fontSize: 14.5, lineHeight: 20, marginTop: 5, letterSpacing: -0.3 },
  sep: { width: 1, marginVertical: 2, backgroundColor: G.rule },
  label: { fontFamily: F.medium, fontSize: 12.5, color: G.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  quick: { minWidth: 84 },
});
