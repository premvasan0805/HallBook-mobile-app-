import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/primitives';
import { Avatar, EventIcon, PaymentBadge } from '@/components/status';
import { fmtLong, inr } from '@/lib/format';
import { SLOT_LABEL, useStore, type Booking, type Customer } from '@/lib/store';
import { makeStyles, useTheme } from '@/lib/theme-context';

export const openBooking = (id: string) => router.push({ pathname: '/booking/[id]', params: { id } });
export const openCustomer = (id: string) => router.push({ pathname: '/customer/[id]', params: { id } });

/**
 * Booking row. `showCustomer` = false on the customer profile, where the name would be redundant,
 * so the event line becomes the title instead.
 */
export function BookingCard({ booking, showCustomer = true }: { booking: Booking; showCustomer?: boolean }) {
  const { customerById } = useStore();
  const name = customerById(booking.customerId)?.name ?? 'Unknown customer';
  const eventLine = `${booking.eventType} · ${SLOT_LABEL[booking.slot]}`;
  const cancelled = booking.status === 'cancelled';
  const { C, T } = useTheme();
  const st = useSt();

  return (
    <Card onPress={() => openBooking(booking.id)} style={st.row}>
      <EventIcon type={booking.eventType} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[T.cardTitle, cancelled && st.cancelled]} numberOfLines={1}>
          {showCustomer ? name : eventLine}
        </Text>
        {showCustomer ? (
          <Text style={T.secondary} numberOfLines={1}>
            {eventLine}
          </Text>
        ) : null}
        <Text style={T.caption}>{fmtLong(booking.date)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[T.amountSm, cancelled && st.cancelled]}>{inr(booking.total)}</Text>
        <PaymentBadge booking={booking} />
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
    </Card>
  );
}

export function CustomerCard({ customer, meta }: { customer: Customer; meta?: string }) {
  const { C, T } = useTheme();
  const st = useSt();
  return (
    <Card onPress={() => openCustomer(customer.id)} style={st.row}>
      <Avatar name={customer.name} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={T.cardTitle} numberOfLines={1}>
          {customer.name}
        </Text>
        <Text style={T.secondary}>{customer.phone || 'No phone'}</Text>
      </View>
      {meta ? <Text style={T.caption}>{meta}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
    </Card>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
    cancelled: { color: t.C.textMuted, textDecorationLine: 'line-through' },
  }),
);
