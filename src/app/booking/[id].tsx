import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BrandPageHeader } from '@/components/brand-page';
import { openCustomer } from '@/components/cards';
import { ConfirmDialog, useToast } from '@/components/overlays';
import { ErrorState, Screen, Touchable } from '@/components/primitives';
import { RecordPaymentSheet } from '@/components/sheets';
import { fmtDate, fmtFull, fmtLong, inr, MONTHS, parseISO } from '@/lib/format';
import { balanceOf, GST_RATE, paidOf, payState, SLOT_LABEL, useStore, type BookingStatus } from '@/lib/store';
import { appWidth, C, F } from '@/lib/theme';

type Ion = ComponentProps<typeof Ionicons>['name'];
type Mci = ComponentProps<typeof MaterialCommunityIcons>['name'];

const BUTTON_MANDALA = require('../../../assets/images/booking/button-mandala.png');

/** This screen is laid out on an 853px-wide design reference; `u(px)` converts a reference pixel to dp. */
const REF_WIDTH = 853;

const BURGUNDY = '#7B1030';
const INK = '#1C1B22';
const GREY = '#6E6D72';
const RULE = '#ECDBCE';
const PINK = '#F9E8EA';
const PANEL = '#FAF5F0';
const RED = '#C8102E';

const TONES = {
  warning: { bg: '#FEEBD3', fg: '#A9600E' },
  success: { bg: '#E3F2E6', fg: '#2E7D4F' },
  info: { bg: '#E6EEF7', fg: '#3B5F8A' },
  danger: { bg: '#FBE3E5', fg: RED },
};

const STATUS_PILL: Record<BookingStatus, { tone: keyof typeof TONES; icon: Ion }> = {
  confirmed: { tone: 'success', icon: 'checkmark-circle-outline' },
  tentative: { tone: 'warning', icon: 'time-outline' },
  enquiry: { tone: 'info', icon: 'help-circle-outline' },
  cancelled: { tone: 'danger', icon: 'close-circle-outline' },
};

const PAY_PILL = {
  paid: { label: 'PAID', icon: 'checkmark-circle-outline', tone: 'success' },
  due: { label: 'PARTIAL', icon: 'time-outline', tone: 'warning' },
  unpaid: { label: 'UNPAID', icon: 'time-outline', tone: 'warning' },
  cancelled: { label: 'CANCELLED', icon: 'close-circle-outline', tone: 'danger' },
} as const;

/** Event-type glyphs for the round badge beside the title and the small one in the meta row. */
const EVENT_GLYPH: Record<string, { badge: Mci; meta: Mci }> = {
  Wedding: { badge: 'ring', meta: 'heart-outline' },
  Engagement: { badge: 'diamond-stone', meta: 'diamond-outline' },
  Party: { badge: 'account-group-outline', meta: 'party-popper' },
  'Family Function': { badge: 'account-group-outline', meta: 'home-heart' },
  Reception: { badge: 'glass-wine', meta: 'glass-cocktail' },
  'Company Function': { badge: 'briefcase-outline', meta: 'office-building-outline' },
};
const DEFAULT_GLYPH = { badge: 'calendar-star' as Mci, meta: 'star-four-points-outline' as Mci };

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings, customerById, hall, cancelBooking } = useStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const u = (px: number) => (appWidth(width) / REF_WIDTH) * px;
  const toast = useToast();
  const [pay, setPay] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    return (
      <Screen title="Booking Details" back>
        <ErrorState title="Booking not found" message="It may have been removed." />
      </Screen>
    );
  }

  const cust = customerById(booking.customerId);
  const phone = cust?.phone.replace(/\D/g, '') ?? '';
  const paid = paidOf(booking);
  const due = balanceOf(booking);
  const cancelled = booking.status === 'cancelled';
  const status = STATUS_PILL[booking.status];
  const payPill = PAY_PILL[payState(booking)];
  const glyph = EVENT_GLYPH[booking.eventType] ?? DEFAULT_GLYPH;
  const d = parseISO(booking.date);
  const weekday = fmtLong(booking.date).split(',')[0];
  const edit = () => router.push({ pathname: '/booking/new', params: { id: booking.id } });
  const call = () => Linking.openURL(`tel:${phone}`);
  const whatsapp = () => Linking.openURL(`https://wa.me/91${phone}`);
  const extras = [
    ['Bride', booking.brideName],
    ['Groom', booking.groomName],
    ['Expected guests', booking.guests],
    ['Price note', booking.priceReason],
  ].filter(([, v]) => v) as [string, string][];

  const text = (font: string, size: number, line: number, color: string) => ({
    fontFamily: font,
    fontSize: u(size),
    lineHeight: u(line),
    color,
  });
  const card = {
    marginHorizontal: u(25),
    borderRadius: u(26),
    backgroundColor: '#FFFCFA',
    borderWidth: 1,
    borderColor: '#F2E7DF',
    boxShadow: `0px ${u(5)}px ${u(16)}px rgba(120, 70, 40, 0.07)`,
  } as const;
  const circle = (size: number, bg = PINK) =>
    ({ width: u(size), height: u(size), borderRadius: u(size / 2), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }) as const;
  const divider = { height: 1.2, backgroundColor: RULE, marginHorizontal: u(25) } as const;

  /** Card heading: 54px icon slot (optionally on a pink disc) and a burgundy serif title. */
  const heading = (icon: ReactNode, title: string, onDisc: boolean, right?: ReactNode) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(16), marginLeft: u(26), height: u(54) }}>
      <View style={onDisc ? circle(54) : { width: u(54), height: u(54), alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <Text style={[text(F.pageSerifBold, 27.5, 34, BURGUNDY), { marginLeft: u(26), flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );

  const pill = (label: string, icon: Ion, tone: keyof typeof TONES) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: u(12),
        height: u(48),
        paddingHorizontal: u(19),
        borderRadius: u(24),
        backgroundColor: TONES[tone].bg,
      }}>
      <Ionicons name={icon} size={u(30)} color={TONES[tone].fg} />
      <Text style={[text(F.semibold, 19.4, 24, TONES[tone].fg), { letterSpacing: u(0.8) }]}>{label}</Text>
    </View>
  );

  const metaSep = <View style={{ width: 1.2, height: u(28), backgroundColor: RULE, marginHorizontal: u(19) }} />;
  const meta = (icon: ReactNode, label: string, shrink?: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(12), flexShrink: shrink ? 1 : 0 }}>
      {icon}
      <Text style={text(F.regular, 19.5, 24, INK)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <BrandPageHeader title="Booking" accent="Details" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: u(26), paddingBottom: insets.bottom, gap: u(26) }}>
      {/* ---------- Summary ---------- */}
      <View style={[card, { borderColor: '#E8D2BD', borderWidth: 1.5, flexDirection: 'row', padding: u(27), paddingTop: u(37), paddingRight: u(25), paddingBottom: u(25) }]}>
        <View style={{ width: u(153), height: u(205), borderRadius: u(22), backgroundColor: '#FAE6E8', alignItems: 'center', marginRight: u(30) }}>
          <Text style={[text(F.pageSerifBold, 60, 66, BURGUNDY), { marginTop: u(27) }]}>{String(d.getDate()).padStart(2, '0')}</Text>
          <Text style={[text(F.medium, 22.6, 28, '#5E0E22'), { marginTop: u(9), letterSpacing: u(0.6) }]}>
            {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
          </Text>
          <View style={{ marginTop: u(15), width: u(87), height: u(38), borderRadius: u(19), backgroundColor: '#F8D6DB', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={text(F.medium, 21.2, 26, BURGUNDY)}>{weekday}</Text>
          </View>
        </View>

        <View style={{ flex: 1, marginTop: -u(5) }}>
          <Text style={[text(F.regular, 24.2, 30, GREY), { letterSpacing: u(0.4) }]}>{booking.number}</Text>
          <View style={{ position: 'absolute', right: -u(3), top: -u(7) }}>{pill(booking.status.toUpperCase(), status.icon, status.tone)}</View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(16), marginLeft: -u(2), height: u(60) }}>
            <View style={circle(60)}>
              <MaterialCommunityIcons name={glyph.badge} size={u(34)} color={BURGUNDY} />
            </View>
            <Text
              style={[text(F.pageSerifBold, 37, 44, cancelled ? '#9A9A9F' : INK), { marginLeft: u(24), flex: 1 }, cancelled && { textDecorationLine: 'line-through' }]}
              numberOfLines={1}>
              {booking.eventType}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(24) }}>
            {meta(<Ionicons name="time-outline" size={u(28)} color={BURGUNDY} />, SLOT_LABEL[booking.slot])}
            {metaSep}
            {meta(<MaterialCommunityIcons name={glyph.meta} size={u(28)} color={BURGUNDY} />, booking.eventType)}
            {metaSep}
            {meta(<MaterialCommunityIcons name="office-building-outline" size={u(28)} color={BURGUNDY} />, hall.name, true)}
          </View>

          <View style={{ height: 1.2, backgroundColor: RULE, marginTop: u(20) }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(17), marginTop: u(17) }}>
            <MaterialCommunityIcons name="calendar-month-outline" size={u(32)} color={BURGUNDY} />
            <Text style={text(F.regular, 21.9, 28, '#505055')} numberOfLines={1}>
              Booked on {fmtLong(booking.bookedOn)}
            </Text>
          </View>
        </View>
      </View>

      {/* ---------- Customer ---------- */}
      <Touchable onPress={cust ? () => openCustomer(cust.id) : undefined} disabled={!cust} style={[card, { paddingBottom: u(22) }]}>
        {heading(<Ionicons name="person-outline" size={u(30)} color={BURGUNDY} />, 'Customer', true)}
        <View style={[divider, { marginTop: u(9) }]} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(14), marginLeft: u(38), marginRight: u(24) }}>
          <View style={circle(100, '#F8E4E6')}>
            <Text style={text(F.pageSerifBold, 33, 40, BURGUNDY)}>{initialsOf(cust?.name ?? '?')}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: u(29) }}>
            <Text style={text(F.pageSerifBold, 26.7, 34, INK)} numberOfLines={1}>
              {cust?.name ?? 'Unknown customer'}
            </Text>
            <Text style={[text(F.regular, 23.6, 30, GREY), { marginTop: u(7), letterSpacing: u(0.5) }]}>{cust?.phone || 'No phone'}</Text>
          </View>
          {phone ? (
            <>
              <Touchable onPress={call} accessibilityLabel="Call" hitSlop={4} style={circle(64, '#F8DFE3')}>
                <Ionicons name="call" size={u(30)} color={BURGUNDY} />
              </Touchable>
              <Touchable onPress={whatsapp} accessibilityLabel="WhatsApp" hitSlop={4} style={[circle(64, '#F8DFE3'), { marginLeft: u(24) }]}>
                <Ionicons name="logo-whatsapp" size={u(34)} color={BURGUNDY} />
              </Touchable>
            </>
          ) : null}
          {cust ? (
            <View style={[circle(60, '#F8EEF0'), { marginLeft: u(24) }]}>
              <Ionicons name="chevron-forward" size={u(30)} color="#A58A90" />
            </View>
          ) : null}
        </View>
      </Touchable>

      {/* ---------- Event ---------- */}
      <View style={[card, { paddingBottom: u(18) }]}>
        {heading(<MaterialCommunityIcons name="calendar-blank-outline" size={u(44)} color={BURGUNDY} />, 'Event Details', false)}
        <View style={{ flexDirection: 'row', marginTop: u(11), marginHorizontal: u(25), borderRadius: u(18), backgroundColor: PANEL, paddingTop: u(25), paddingBottom: u(16) }}>
          <EventCell u={u} flex={264} icon={<MaterialCommunityIcons name="calendar-month-outline" size={u(38)} color={BURGUNDY} />} label="Date" value={fmtLong(booking.date)} />
          <PanelSep u={u} />
          <EventCell u={u} flex={240} icon={<Ionicons name="time-outline" size={u(38)} color={BURGUNDY} />} label="Timing" value={SLOT_LABEL[booking.slot]} />
          <PanelSep u={u} />
          <EventCell u={u} flex={251} icon={<MaterialCommunityIcons name="office-building-outline" size={u(38)} color={BURGUNDY} />} label="Hall" value={hall.name} />
        </View>
      </View>

      {/* ---------- Payments ---------- */}
      <View style={[card, { paddingBottom: u(22) }]}>
        {heading(
          <MaterialCommunityIcons name="wallet-outline" size={u(32)} color={BURGUNDY} />,
          'Payments',
          true,
          <View style={{ marginRight: u(22) }}>{pill(payPill.label, payPill.icon, payPill.tone)}</View>,
        )}
        <View style={{ flexDirection: 'row', marginTop: u(12), marginHorizontal: u(25), borderRadius: u(18), backgroundColor: '#FBF7F4', paddingTop: u(23), paddingBottom: u(19) }}>
          <AmountCell u={u} flex={252} padLeft={29} label="Total Amount" value={booking.total} color={INK} />
          <PanelSep u={u} />
          <AmountCell u={u} flex={259} padLeft={39} label="Paid Amount" value={paid} color={paid > 0 ? '#2E7D4F' : '#77777C'} />
          <PanelSep u={u} />
          <AmountCell u={u} flex={244} padLeft={37} label="Balance Amount" value={due} color={due > 0 && !cancelled ? '#A8650F' : '#77777C'} />
        </View>

        {booking.gstAmount ? (
          <View style={{ gap: u(10), marginTop: u(18), marginHorizontal: u(29) }}>
            <InfoRow u={u} label="Non-GST amount" value={inr(booking.nonGstAmount ?? 0)} />
            <InfoRow u={u} label="GST amount" value={inr(booking.gstAmount)} />
            <InfoRow u={u} label={`GST ${GST_RATE * 100}%`} value={inr(Math.round(booking.gstAmount * GST_RATE))} />
          </View>
        ) : null}

        {booking.payments.length > 0 ? (
          <View style={{ marginTop: u(18), marginHorizontal: u(29), gap: u(16) }}>
            <Text style={[text(F.semibold, 18, 24, GREY), { letterSpacing: u(1) }]}>HISTORY</Text>
            {booking.payments.map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: u(20) }}>
                <View style={circle(56, TONES.success.bg)}>
                  <Ionicons name="checkmark" size={u(30)} color={TONES.success.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={text(F.pageSerifBold, 26, 32, INK)}>
                    <Money value={p.amount} u={u} size={26} />
                  </Text>
                  <Text style={text(F.regular, 20, 26, GREY)}>
                    {p.mode} · {fmtDate(p.date)}
                    {p.reference ? ` · Ref ${p.reference}` : ''}
                  </Text>
                  {p.notes ? <Text style={text(F.regular, 20, 26, GREY)}>{p.notes}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {!cancelled && due > 0 ? (
          <Touchable
            onPress={() => setPay(true)}
            accessibilityRole="button"
            accessibilityLabel="Add Payment"
            style={{
              marginTop: u(7),
              marginHorizontal: u(25),
              height: u(82),
              borderRadius: u(16),
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: u(25),
            }}>
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="addPayFill" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#7A0C2A" />
                  <Stop offset="1" stopColor="#881537" />
                </LinearGradient>
              </Defs>
              <Rect width={100} height={100} fill="url(#addPayFill)" />
            </Svg>
            <Image source={BUTTON_MANDALA} style={{ position: 'absolute', left: u(540), top: u(3), width: u(214), height: u(77) }} />
            <Ionicons name="add" size={u(42)} color="#FFFFFF" />
            <Text style={text(F.pageSerifBold, 28.8, 36, '#FFFFFF')}>Add Payment</Text>
          </Touchable>
        ) : null}
      </View>

      {/* ---------- Additional information ---------- */}
      <View style={[card, { paddingBottom: u(26) }]}>
        {heading(<Ionicons name="document-text-outline" size={u(30)} color={BURGUNDY} />, 'Additional Information', true)}
        <View style={[divider, { marginTop: u(13) }]} />
        {extras.length > 0 ? (
          <View style={{ gap: u(10), marginTop: u(18), marginHorizontal: u(38) }}>
            {extras.map(([k, v]) => (
              <InfoRow key={k} u={u} label={k} value={v} />
            ))}
          </View>
        ) : null}
        <Touchable
          onPress={cancelled ? undefined : edit}
          disabled={cancelled}
          accessibilityLabel="Edit notes"
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(17), marginLeft: u(38), marginRight: u(35) }}>
          <View style={circle(72, '#F8E4E6')}>
            <Ionicons name="document-text-outline" size={u(34)} color={BURGUNDY} />
          </View>
          <View style={{ flex: 1, marginLeft: u(29) }}>
            <Text style={text(F.regular, 18.9, 24, GREY)}>Notes</Text>
            <Text style={[text(F.medium, 22, 30, INK), { marginTop: u(4) }]}>{booking.notes || '-'}</Text>
          </View>
          {!cancelled ? <Ionicons name="chevron-forward" size={u(34)} color="#8E8E93" /> : null}
        </Touchable>
      </View>

      {/* ---------- Cancel ---------- */}
      {!cancelled ? (
        <Touchable
          onPress={() => setConfirmCancel(true)}
          accessibilityRole="button"
          accessibilityLabel="Cancel Booking"
          style={{
            marginHorizontal: u(25),
            height: u(88),
            borderRadius: u(22),
            borderWidth: 1.5,
            borderColor: '#D0142C',
            backgroundColor: '#FDF1F0',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: u(24),
          }}>
          <MaterialCommunityIcons name="trash-can-outline" size={u(44)} color={RED} />
          <Text style={text(F.pageSerifBold, 28.6, 36, RED)}>Cancel Booking</Text>
        </Touchable>
      ) : null}

      <View style={{ height: u(40) }} />
      </ScrollView>

      <RecordPaymentSheet booking={booking} visible={pay} onClose={() => setPay(false)} />

      <ConfirmDialog
        visible={confirmCancel}
        destructive
        title="Cancel this booking?"
        message={`${booking.number} on ${fmtFull(booking.date)} will be marked cancelled and the slot freed. This can't be undone.`}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          cancelBooking(booking.id);
          setConfirmCancel(false);
          toast('Booking cancelled');
        }}
      />
    </View>
  );
}

type U = (px: number) => number;

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

function PanelSep({ u }: { u: U }) {
  return <View style={{ width: 1.2, marginVertical: u(18), backgroundColor: '#EBD5C6' }} />;
}

function EventCell({ u, flex, icon, label, value }: { u: U; flex: number; icon: ReactNode; label: string; value: string }) {
  return (
    <View style={{ flex, flexDirection: 'row', paddingLeft: u(20), paddingRight: u(2), gap: u(17) }}>
      <View style={{ marginTop: u(-2) }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.regular, fontSize: u(19.2), lineHeight: u(24), color: GREY }}>{label}</Text>
        <Text style={{ fontFamily: F.pageSerifBold, fontSize: u(23), lineHeight: u(31), color: INK, marginTop: u(5) }} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function AmountCell({ u, flex, padLeft, label, value, color }: { u: U; flex: number; padLeft: number; label: string; value: number; color: string }) {
  return (
    <View style={{ flex, paddingLeft: u(padLeft), paddingRight: u(8) }}>
      <Text style={{ fontFamily: F.regular, fontSize: u(19.9), lineHeight: u(26), color: GREY }} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={{ fontFamily: F.pageSerifBold, fontSize: u(37.5), lineHeight: u(44), color, marginTop: u(7) }}
        numberOfLines={1}
        adjustsFontSizeToFit>
        <Money value={value} u={u} size={37.5} />
      </Text>
    </View>
  );
}

/** PT Serif draws ₹ like ₽, so the symbol is set in Inter Bold and the digits stay serif. */
function Money({ value, u, size }: { value: number; u: U; size: number }) {
  const s = inr(value);
  const i = s.indexOf('₹');
  if (i < 0) return <>{s}</>;
  return (
    <>
      {s.slice(0, i)}
      <Text style={{ fontFamily: F.bold, fontSize: u(size * 0.92) }}>₹</Text>
      {s.slice(i + 1)}
    </>
  );
}

function InfoRow({ u, label, value }: { u: U; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: u(24) }}>
      <Text style={{ fontFamily: F.regular, fontSize: u(21), lineHeight: u(28), color: GREY }}>{label}</Text>
      <Text style={{ fontFamily: F.medium, fontSize: u(21), lineHeight: u(28), color: INK, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
