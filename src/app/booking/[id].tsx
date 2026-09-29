import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { openCustomer } from '@/components/cards';
import { GlossTile, glassSurface, GradientFill, Sheen } from '@/components/glass';
import { GlassActionButton } from '@/components/glass-action';
import { GlassBackdrop } from '@/components/glass-header';
import { ConfirmDialog, useToast } from '@/components/overlays';
import { ErrorState, goBack, Screen, Touchable } from '@/components/primitives';
import { RecordPaymentSheet } from '@/components/sheets';
import { fmtDate, fmtFull, fmtLong, inr, MONTHS, parseISO } from '@/lib/format';
import { balanceOf, GST_RATE, paidOf, payState, SLOT_LABEL, useStore, type BookingStatus } from '@/lib/store';
import { appWidth, F } from '@/lib/theme';

type Ion = ComponentProps<typeof Ionicons>['name'];
type Mci = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** This screen is laid out on an 853px-wide design reference; `u(px)` converts a reference pixel to dp. */
const REF_WIDTH = 853;

/** Blue glass palette, shared with Home and the Customers screens. */
const INK = '#131D38';
const NAVY = '#1F3A70';
const BLUE = '#2F63C0';
const GREY = '#5B6275';
const RULE = 'rgba(31, 58, 112, 0.14)';
const RED = '#B8102C';

/** Glossy pill tones: gradient body, strong foreground. */
const TONES = {
  warning: { from: '#FFF7E6', to: '#FBE3B4', fg: '#B0680A' },
  success: { from: '#EFFAF4', to: '#CDEBDA', fg: '#1F7A4A' },
  info: { from: '#F2F7FF', to: '#D8E6FA', fg: '#2F5FA8' },
  danger: { from: '#FFF1F4', to: '#FBD9E0', fg: '#D42A45' },
};

/** Tinted glossy discs and tiles. */
const TINT = {
  blue: { from: '#F4F8FF', to: '#D9E6FA', fg: BLUE },
  lilac: { from: '#F8F5FF', to: '#E2D9F8', fg: '#5B3FC4' },
  mint: { from: '#F1FBF6', to: '#CDEFDD', fg: '#13824F' },
  peach: { from: '#FFF6EE', to: '#F8DEC8', fg: '#B0612A' },
  glass: { from: '#FFFFFF', to: '#E9F0FB', fg: NAVY },
};
type Tint = (typeof TINT)[keyof typeof TINT];

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
  const card: ViewStyle = { marginHorizontal: u(27), ...glassSurface('rgba(255, 255, 255, 0.5)', u(30)) };
  /** Frosted inset panel inside a card. */
  const panel: ViewStyle = {
    marginHorizontal: u(19),
    borderRadius: u(24),
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: 'inset 0px 1.5px 0px rgba(255, 255, 255, 1), inset 0px 0px 14px rgba(255, 255, 255, 0.6), 0px 4px 12px rgba(31, 58, 112, 0.06)',
  };
  const divider = { height: 1, backgroundColor: RULE, marginHorizontal: u(25) } as const;

  const orb = (size: number, tint: Tint, children: ReactNode, square?: boolean) => (
    <GlossTile from={tint.from} to={tint.to} radius={u(square ? size * 0.3 : size / 2)} style={{ width: u(size), height: u(size) }}>
      {children}
    </GlossTile>
  );

  /** Card heading: 56px glossy disc with a blue glyph, then an ink serif title. */
  const heading = (icon: ReactNode, title: string, right?: ReactNode, square?: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(16), marginLeft: u(24), height: u(56) }}>
      {orb(56, TINT.blue, icon, square)}
      <Text style={[text(F.pageSerifBold, 29, 36, INK), { marginLeft: u(26), flex: 1, letterSpacing: -u(0.4) }]} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );

  const pill = (label: string, icon: Ion, tone: keyof typeof TONES) => (
    <GlossTile
      from={TONES[tone].from}
      to={TONES[tone].to}
      radius={u(25)}
      style={{ flexDirection: 'row', gap: u(12), height: u(50), paddingHorizontal: u(20) }}>
      <Ionicons name={icon} size={u(30)} color={TONES[tone].fg} />
      <Text style={[text(F.semibold, 20, 26, TONES[tone].fg), { letterSpacing: u(0.8) }]}>{label}</Text>
    </GlossTile>
  );

  const metaSep = <View style={{ width: 1, height: u(28), backgroundColor: RULE, marginHorizontal: u(19) }} />;
  const meta = (icon: ReactNode, label: string, shrink?: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(12), flexShrink: shrink ? 1 : 0 }}>
      {icon}
      <Text style={text(F.regular, 20, 26, INK)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  const headerOrb = (icon: ReactNode, label: string, onPress: () => void) => (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[{ width: u(78), height: u(78), alignItems: 'center', justifyContent: 'center' }, glassSurface('rgba(255, 255, 255, 0.62)', u(39))]}>
      <Sheen radius={u(39)} strength={0.6} />
      {icon}
    </Touchable>
  );

  return (
    <View style={{ flex: 1 }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <GlassBackdrop />
      </View>

      {/* ---------- Header ---------- */}
      <View style={{ paddingTop: insets.top + u(70), paddingHorizontal: u(32), flexDirection: 'row', alignItems: 'center' }}>
        {headerOrb(<Ionicons name="arrow-back" size={u(38)} color={INK} />, 'Back', goBack)}
        <View style={{ flex: 1, marginLeft: u(27) }}>
          <Text style={[text(F.pageSerifBold, 46, 58, INK), { letterSpacing: -u(1.2) }]} numberOfLines={1}>
            Booking <Text style={{ color: BLUE }}>Details</Text>
          </Text>
          <View style={{ position: 'absolute', left: 0, top: u(66) }}>
            <TitleRule u={u} />
          </View>
        </View>
        {!cancelled ? headerOrb(<Ionicons name="ellipsis-vertical" size={u(34)} color={INK} />, 'Edit booking', edit) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: u(44), paddingBottom: insets.bottom, gap: u(24) }}>
        {/* ---------- Summary ---------- */}
        <View style={[card, { flexDirection: 'row', padding: u(22), paddingTop: u(34), paddingRight: u(20), paddingBottom: u(26) }]}>
          <Sheen radius={u(30)} strength={0.55} />
          <GlossTile from="#F3F8FF" to="#D6E4FA" radius={u(26)} style={{ width: u(155), height: u(205), justifyContent: 'flex-start', marginRight: u(32) }}>
            <Text style={[text(F.pageSerifBold, 62, 68, '#1A2C7A'), { marginTop: u(25) }]}>{String(d.getDate()).padStart(2, '0')}</Text>
            <Text style={[text(F.medium, 23, 28, INK), { marginTop: u(8), letterSpacing: u(0.6) }]}>
              {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
            </Text>
            <View style={{ marginTop: u(14), width: u(88), height: u(38), borderRadius: u(19), backgroundColor: 'rgba(186, 208, 244, 0.7)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={text(F.semibold, 21, 26, '#1F4FA8')}>{weekday}</Text>
            </View>
          </GlossTile>

          <View style={{ flex: 1, marginTop: -u(8) }}>
            <Text style={[text(F.regular, 24, 30, GREY), { letterSpacing: u(0.6) }]}>{booking.number}</Text>
            <View style={{ position: 'absolute', right: 0, top: -u(14) }}>{pill(booking.status.toUpperCase(), status.icon, status.tone)}</View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(14), height: u(62) }}>
              {orb(60, TINT.lilac, <MaterialCommunityIcons name={glyph.badge} size={u(34)} color="#3B3FB8" />)}
              <Text
                style={[text(F.pageSerifBold, 40, 48, cancelled ? '#9AA0B0' : INK), { marginLeft: u(22), flex: 1 }, cancelled && { textDecorationLine: 'line-through' }]}
                numberOfLines={1}>
                {booking.eventType}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(22) }}>
              {meta(<Ionicons name="time-outline" size={u(28)} color={BLUE} />, SLOT_LABEL[booking.slot])}
              {metaSep}
              {meta(<MaterialCommunityIcons name={glyph.meta} size={u(28)} color={BLUE} />, booking.eventType)}
              {metaSep}
              {meta(<MaterialCommunityIcons name="office-building-outline" size={u(30)} color={BLUE} />, hall.name, true)}
            </View>

            <View style={{ height: 1, backgroundColor: RULE, marginTop: u(18) }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(18), marginTop: u(16) }}>
              <MaterialCommunityIcons name="calendar-month-outline" size={u(32)} color={BLUE} />
              <Text style={text(F.regular, 22, 28, GREY)} numberOfLines={1}>
                Booked on {fmtLong(booking.bookedOn)}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------- Customer ---------- */}
        <Touchable onPress={cust ? () => openCustomer(cust.id) : undefined} disabled={!cust} style={[card, { paddingBottom: u(22) }]}>
          <Sheen radius={u(30)} strength={0.55} />
          {heading(<Ionicons name="person-outline" size={u(30)} color={BLUE} />, 'Customer')}
          <View style={[divider, { marginTop: u(12) }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(14), marginLeft: u(34), marginRight: u(24) }}>
            {orb(102, TINT.lilac, <Text style={text(F.pageSerifBold, 34, 42, '#2B2F7A')}>{initialsOf(cust?.name ?? '?')}</Text>)}
            <View style={{ flex: 1, marginLeft: u(28) }}>
              <Text style={text(F.pageSerifBold, 30, 38, INK)} numberOfLines={1}>
                {cust?.name ?? 'Unknown customer'}
              </Text>
              <Text style={[text(F.regular, 25, 32, GREY), { marginTop: u(4), letterSpacing: u(0.6) }]}>{cust?.phone || 'No phone'}</Text>
            </View>
            {phone ? (
              <>
                <Touchable onPress={call} accessibilityLabel="Call" hitSlop={4}>
                  <ActionOrb u={u} tint={TINT.mint} glow="rgba(60, 190, 120, 0.4)">
                    <Ionicons name="call" size={u(32)} color={TINT.mint.fg} />
                  </ActionOrb>
                </Touchable>
                <Touchable onPress={whatsapp} accessibilityLabel="WhatsApp" hitSlop={4} style={{ marginLeft: u(25) }}>
                  <ActionOrb u={u} tint={TINT.lilac} glow="rgba(140, 100, 240, 0.4)">
                    <Ionicons name="logo-whatsapp" size={u(34)} color={TINT.lilac.fg} />
                  </ActionOrb>
                </Touchable>
              </>
            ) : null}
            {cust ? (
              <View style={{ marginLeft: u(25) }}>
                <ActionOrb u={u} tint={TINT.glass} glow="rgba(255, 255, 255, 0.9)">
                  <Ionicons name="chevron-forward" size={u(30)} color={NAVY} />
                </ActionOrb>
              </View>
            ) : null}
          </View>
        </Touchable>

        {/* ---------- Event ---------- */}
        <View style={[card, { paddingBottom: u(16) }]}>
          <Sheen radius={u(30)} strength={0.55} />
          {heading(<MaterialCommunityIcons name="calendar-blank-outline" size={u(34)} color={BLUE} />, 'Event Details', undefined, true)}
          <View style={[panel, { flexDirection: 'row', marginTop: u(20), paddingTop: u(24), paddingBottom: u(22) }]}>
            <EventCell u={u} flex={268} tint={TINT.blue} icon="calendar-month-outline" label="Date" value={fmtLong(booking.date)} />
            <PanelSep u={u} />
            <EventCell u={u} flex={238} tint={TINT.lilac} icon="clock-outline" label="Timing" value={SLOT_LABEL[booking.slot]} />
            <PanelSep u={u} />
            <EventCell u={u} flex={256} tint={TINT.peach} icon="office-building-outline" label="Hall" value={hall.name} />
          </View>
        </View>

        {/* ---------- Payments ---------- */}
        <View style={[card, { paddingBottom: u(18) }]}>
          <Sheen radius={u(30)} strength={0.55} />
          {heading(
            <MaterialCommunityIcons name="wallet-outline" size={u(32)} color={BLUE} />,
            'Payments',
            <View style={{ marginRight: u(22) }}>{pill(payPill.label, payPill.icon, payPill.tone)}</View>,
          )}
          <View style={[panel, { flexDirection: 'row', marginTop: u(18), paddingTop: u(22), paddingBottom: u(20) }]}>
            <AmountCell u={u} flex={258} padLeft={32} label="Total Amount" value={booking.total} color={INK} />
            <PanelSep u={u} />
            <AmountCell u={u} flex={256} padLeft={38} label="Paid Amount" value={paid} color={paid > 0 ? '#1F7A4A' : '#8A90A2'} />
            <PanelSep u={u} />
            <AmountCell u={u} flex={248} padLeft={37} label="Balance Amount" value={due} color={due > 0 && !cancelled ? '#B8790F' : '#8A90A2'} />
          </View>

          {booking.gstAmount ? (
            <View style={{ gap: u(10), marginTop: u(18), marginHorizontal: u(32) }}>
              <InfoRow u={u} label="Non-GST amount" value={inr(booking.nonGstAmount ?? 0)} />
              <InfoRow u={u} label="GST amount" value={inr(booking.gstAmount)} />
              <InfoRow u={u} label={`GST ${GST_RATE * 100}%`} value={inr(Math.round(booking.gstAmount * GST_RATE))} />
            </View>
          ) : null}

          {booking.payments.length > 0 ? (
            <View style={{ marginTop: u(18), marginHorizontal: u(32), gap: u(16) }}>
              <Text style={[text(F.semibold, 18, 24, GREY), { letterSpacing: u(1) }]}>HISTORY</Text>
              {booking.payments.map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: u(20) }}>
                  {orb(56, TINT.mint, <Ionicons name="checkmark" size={u(30)} color={TINT.mint.fg} />)}
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
            <GlassActionButton
              title="Add Payment"
              onPress={() => setPay(true)}
              lotus
              height={u(100)}
              style={{ marginTop: u(8), marginHorizontal: u(19) }}
            />
          ) : null}
        </View>

        {/* ---------- Additional information ---------- */}
        <View style={[card, { paddingBottom: u(18) }]}>
          <Sheen radius={u(30)} strength={0.55} />
          {heading(<Ionicons name="document-text-outline" size={u(32)} color={BLUE} />, 'Additional Information')}
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
            style={[panel, { flexDirection: 'row', alignItems: 'center', marginTop: u(20), paddingVertical: u(18), paddingLeft: u(26), paddingRight: u(22) }]}>
            {orb(74, TINT.blue, <Ionicons name="document-text-outline" size={u(36)} color={BLUE} />)}
            <View style={{ flex: 1, marginLeft: u(28) }}>
              <Text style={text(F.regular, 20, 26, GREY)}>Notes</Text>
              <Text style={[text(F.medium, 22, 30, INK), { marginTop: u(4) }]}>{booking.notes || '-'}</Text>
            </View>
            {!cancelled ? <Ionicons name="chevron-forward" size={u(34)} color={NAVY} /> : null}
          </Touchable>
        </View>

        {/* ---------- Cancel ---------- */}
        {!cancelled ? (
          <Touchable
            onPress={() => setConfirmCancel(true)}
            accessibilityRole="button"
            accessibilityLabel="Cancel Booking"
            style={{
              marginHorizontal: u(30),
              height: u(94),
              borderRadius: u(24),
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.95)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: u(24),
              boxShadow:
                'inset 0px 2px 0px rgba(255, 255, 255, 1), inset 0px 0px 18px rgba(255, 255, 255, 0.7), 0px 0px 8px rgba(255, 255, 255, 0.9), 0px 0px 22px rgba(240, 150, 175, 0.45), 0px 10px 22px rgba(180, 40, 80, 0.12)',
            }}>
            <GradientFill from="#FCE9EF" to="#F6CBD7" radius={u(24)} horizontal />
            <Sheen radius={u(24)} strength={0.55} height="50%" />
            <MaterialCommunityIcons name="trash-can-outline" size={u(46)} color={RED} />
            <Text style={text(F.pageSerifBold, 30, 38, RED)}>Cancel Booking</Text>
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

/** Blue line under the page title: fades in, a filled diamond with two dots, then fades out. */
function TitleRule({ u }: { u: U }) {
  const w = u(290);
  const h = u(16);
  const cx = u(110);
  const cy = h / 2;
  const r = u(7);
  return (
    <Svg width={w} height={h}>
      <Path d={`M0 ${cy}H${cx - u(22)}M${cx + u(22)} ${cy}H${w}`} stroke={BLUE} strokeOpacity={0.55} strokeWidth={1.2} />
      <Path d={`M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`} fill={BLUE} />
      <Path d={`M${cx - u(15)} ${cy}l${u(3)} -${u(3)}l${u(3)} ${u(3)}l-${u(3)} ${u(3)}Z`} fill={BLUE} />
      <Path d={`M${cx + u(15)} ${cy}l-${u(3)} -${u(3)}l-${u(3)} ${u(3)}l${u(3)} ${u(3)}Z`} fill={BLUE} />
    </Svg>
  );
}

/** 70px glossy orb with a coloured halo, for the customer quick actions. */
function ActionOrb({ u, tint, glow, children }: { u: U; tint: Tint; glow: string; children: ReactNode }) {
  return (
    <GlossTile
      from={tint.from}
      to={tint.to}
      radius={u(35)}
      style={{
        width: u(70),
        height: u(70),
        boxShadow: `inset 0px 1.5px 0px rgba(255, 255, 255, 1), inset 0px 0px 10px rgba(255, 255, 255, 0.8), 0px 0px 0px 1px rgba(255, 255, 255, 0.6), 0px 0px 16px ${glow}, 0px 4px 10px rgba(31, 58, 112, 0.1)`,
      }}>
      {children}
    </GlossTile>
  );
}

function PanelSep({ u }: { u: U }) {
  return <View style={{ width: 1, marginVertical: u(4), backgroundColor: RULE }} />;
}

function EventCell({ u, flex, tint, icon, label, value }: { u: U; flex: number; tint: Tint; icon: Mci; label: string; value: string }) {
  return (
    <View style={{ flex, flexDirection: 'row', paddingLeft: u(16), paddingRight: u(4), gap: u(16) }}>
      <GlossTile from={tint.from} to={tint.to} radius={u(14)} style={{ width: u(54), height: u(54) }}>
        <MaterialCommunityIcons name={icon} size={u(34)} color={tint.fg} />
      </GlossTile>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.regular, fontSize: u(20), lineHeight: u(26), color: GREY }}>{label}</Text>
        <Text style={{ fontFamily: F.pageSerifBold, fontSize: u(23), lineHeight: u(31), color: INK, marginTop: u(4) }} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function AmountCell({ u, flex, padLeft, label, value, color }: { u: U; flex: number; padLeft: number; label: string; value: number; color: string }) {
  return (
    <View style={{ flex, paddingLeft: u(padLeft), paddingRight: u(8) }}>
      <Text style={{ fontFamily: F.regular, fontSize: u(20), lineHeight: u(26), color: GREY }} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={{ fontFamily: F.pageSerifBold, fontSize: u(40), lineHeight: u(48), color, marginTop: u(6) }}
        numberOfLines={1}
        adjustsFontSizeToFit>
        <Money value={value} u={u} size={40} />
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
