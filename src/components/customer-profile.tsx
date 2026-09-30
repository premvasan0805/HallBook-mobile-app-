import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useId, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { openBooking } from '@/components/cards';
import { GlossTile, glassSurface, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassBrandHeader } from '@/components/glass-header';
import { EmptyState, ErrorState, goBack, Screen, Touchable, type IconName } from '@/components/primitives';
import { fmtDate, fmtShort, initials, inr, MONTHS, parseISO } from '@/lib/format';
import { payState, SLOT_LABEL, useStore, type Booking, type PayState, type SlotKey } from '@/lib/store';
import { F, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/**
 * Customer profile on the blue glass backdrop: brand header, contact card with glowing quick actions,
 * and the customer's bookings as glass cards with tinted date blocks. Rendered inside the Customers tab
 * and, from a booking, as a full-screen route.
 */
/** `tab`: shown inside the Customers tab, so the scroll end clears the floating tab bar. */
export function CustomerProfile({ id, tab }: { id: string; tab?: boolean }) {
  const { customerById, bookings } = useStore();
  const cust = customerById(id);
  const list = cust
    ? bookings.filter((b) => b.customerId === cust.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const phone = cust?.phone.replace(/\D/g, '') ?? '';
  const t = useTheme();
  const st = useSt();
  const action = actionTones(t);

  return (
    <Screen
      tab={tab}
      header={<GlassBrandHeader hallIcon="bank" />}
      backdrop={<GlassBackdrop />}
      contentStyle={st.content}>
      <View style={st.titleRow}>
        <Touchable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={t.G.ink} />
        </Touchable>
        <Text style={st.title}>Customer</Text>
        <DiamondRule width={96} at={0.9} />
      </View>

      {!cust ? (
        <ErrorState title="Customer not found" />
      ) : (
        <>
          <View style={[st.profile, glassSurface(t, t.frost(0.5), 22)]}>
            <Sheen radius={22} strength={0.55} />
            <View style={st.who}>
              <GlossTile from={t.tone.blue.from} to={t.tone.blue.to} radius={21} style={st.avatar}>
                <Text style={st.avatarText}>{initials(cust.name)}</Text>
              </GlossTile>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.name} numberOfLines={1}>
                  {cust.name}
                </Text>
                <Text style={st.phone}>{cust.phone || 'No phone number'}</Text>
              </View>
            </View>
            {phone ? (
              <View style={st.actions}>
                <Action tone={action.call} icon="call" label="Call" onPress={() => Linking.openURL(`tel:${phone}`)} />
                <Action
                  tone={action.whatsapp}
                  icon="logo-whatsapp"
                  label="WhatsApp"
                  onPress={() => Linking.openURL(`https://wa.me/91${phone}`)}
                />
                <Action
                  tone={action.sms}
                  icon="chatbubble-ellipses"
                  label="SMS"
                  onPress={() => Linking.openURL(`sms:${phone}`)}
                />
              </View>
            ) : null}
          </View>

          <SectionTitle />

          {list.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No bookings yet" message="Bookings for this customer show here." />
          ) : (
            <View style={{ gap: 10 }}>
              {list.map((b) => (
                <BookingRow key={b.id} booking={b} name={cust.name} />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

/** "Bookings" heading with a rule that stretches to the card edge. */
function SectionTitle() {
  const [w, setW] = useState(0);
  const t = useTheme();
  const st = useSt();
  return (
    <View style={st.sectionRow}>
      <MaterialCommunityIcons name="calendar-month-outline" size={24} color={t.G.blue} />
      <Text style={st.section}>Bookings</Text>
      <View style={{ flex: 1 }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
        {w > 0 ? <DiamondRule width={w} at={Math.min(0.52, 70 / w)} trail /> : null}
      </View>
    </View>
  );
}

/** Thin blue line with a hollow diamond; `trail` continues it faintly past the diamond. */
function DiamondRule({ width, at, trail }: { width: number; at: number; trail?: boolean }) {
  const id = 'dr' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const cx = Math.round(width * at);
  const t = useTheme();
  const BLUE = t.G.blue;
  return (
    <Svg width={width} height={14} viewBox={`0 0 ${width} 14`}>
      <Defs>
        <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={7} x2={width} y2={7}>
          <Stop offset="0" stopColor={BLUE} stopOpacity={0.25} />
          <Stop offset={String(cx / width)} stopColor={BLUE} stopOpacity={0.9} />
          <Stop offset="1" stopColor={BLUE} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={`M0 7H${cx - 6}${trail ? `M${cx + 6} 7H${width}` : ''}`} stroke={`url(#${id})`} strokeWidth={1.3} />
      <Path
        d={`M${cx} 2.2L${cx + 4.8} 7L${cx} 11.8L${cx - 4.8} 7Z`}
        fill={t.frost(0.9)}
        stroke={BLUE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Tone = { fg: string; from: string; to: string; glow: string };

/** Quick actions: each orb carries its own tint and a faint coloured halo (none in dark). */
const actionTones = (t: Theme): Record<'call' | 'whatsapp' | 'sms', Tone> => ({
  call: t.tone.mint,
  whatsapp: t.tone.violet,
  sms: t.tone.blue,
});

function Action({ tone, icon, label, onPress }: { tone: Tone; icon: IconName; label: string; onPress: () => void }) {
  const t = useTheme();
  const st = useSt();
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={st.action}>
      <GlossTile
        from={tone.from}
        to={tone.to}
        radius={19}
        style={[
          st.actionOrb,
          {
            boxShadow: t.dark
              ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 4px 10px ${t.shadow}`
              : `inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 0px 10px ${tone.glow}, 0px 4px 10px ${t.shadow}`,
          },
        ]}>
        <Ionicons name={icon} size={17} color={tone.fg} />
      </GlossTile>
      <Text style={st.actionLabel}>{label}</Text>
    </Touchable>
  );
}

/** Date-block tint: cancelled bookings go rose, the rest follow their slot. */
const dateTones = ({ tone }: Theme): Record<SlotKey | 'cancelled', { fg: string; from: string; to: string }> => ({
  full: tone.blue,
  first: tone.sand,
  second: tone.violet,
  early: tone.mint,
  cancelled: tone.rose,
});

const slotIcons = ({ S, tone }: Theme): Record<SlotKey, { name: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> => ({
  full: { name: 'white-balance-sunny', color: S.tentative },
  first: { name: 'weather-sunny', color: tone.peach.fg },
  second: { name: 'moon-waning-crescent', color: tone.violet.fg },
  early: { name: 'weather-sunset-up', color: S.tentative },
});

const payPills = ({ C, tone }: Theme): Record<PayState, { label: string; icon: IconName; fg: string; from: string; to: string }> => ({
  cancelled: { label: 'CANCELLED', icon: 'close-circle-outline', fg: C.danger, from: tone.rose.from, to: tone.rose.to },
  paid: { label: 'PAID', icon: 'checkmark-circle-outline', fg: C.success, from: tone.mint.from, to: tone.mint.to },
  due: { label: 'DUE', icon: 'time-outline', fg: C.warning, from: tone.sand.from, to: tone.sand.to },
  unpaid: { label: 'UNPAID', icon: 'alarm-outline', fg: C.danger, from: tone.rose.from, to: tone.rose.to },
});

/** Booking card: tinted date block, slot and booked-on date, then amount and payment state. */
function BookingRow({ booking, name }: { booking: Booking; name: string }) {
  const d = parseISO(booking.date);
  const t = useTheme();
  const st = useSt();
  const state = payState(booking);
  const pill = payPills(t)[state];
  const tone = dateTones(t)[state === 'cancelled' ? 'cancelled' : booking.slot];
  const slotIcon = slotIcons(t)[booking.slot];

  return (
    <Touchable
      onPress={() => openBooking(booking.id)}
      accessibilityRole="button"
      accessibilityLabel={`${fmtDate(booking.date)}, ${SLOT_LABEL[booking.slot]}, ${inr(booking.total)}, ${pill.label}`}
      style={[st.booking, glassSurface(t, t.frost(0.55), 20)]}>
      <Sheen radius={20} strength={0.5} />
      <GlossTile from={tone.from} to={tone.to} radius={12} style={st.dateBlock}>
        <Text style={[st.dateDay, { color: tone.fg }]}>{String(d.getDate()).padStart(2, '0')}</Text>
        <Text style={[st.dateMonth, { color: tone.fg }]}>
          {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
        </Text>
        <View style={[st.dateRule, { backgroundColor: tone.fg }]} />
        <Text style={st.dateWeekday}>{fmtShort(booking.date).split(' ')[0]}</Text>
      </GlossTile>

      <View style={st.bookingMid}>
        <Text style={st.bookingName} numberOfLines={1}>
          {name}
        </Text>
        <View style={st.metaRow}>
          <MaterialCommunityIcons name={slotIcon.name} size={17} color={slotIcon.color} />
          <Text style={st.metaStrong} numberOfLines={1}>
            {SLOT_LABEL[booking.slot]}
          </Text>
        </View>
        <View style={st.metaRow}>
          <Ionicons name="document-text-outline" size={15} color={t.G.navy} />
          <Text style={st.meta} numberOfLines={1}>
            Booked on {fmtDate(booking.bookedOn)}
          </Text>
        </View>
      </View>

      <View style={st.vRule} />

      <View style={st.bookingRight}>
        <Text style={st.amount} numberOfLines={1} adjustsFontSizeToFit>
          {inr(booking.total)}
        </Text>
        <GlossTile from={pill.from} to={pill.to} radius={999} style={st.pill}>
          <Ionicons name={pill.icon} size={14} color={pill.fg} />
          <Text style={[st.pillText, { color: pill.fg }]}>{pill.label}</Text>
        </GlossTile>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.G.ink} />
    </Touchable>
  );
}

const useSt = makeStyles(({ G }: Theme) =>
  StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 0, gap: 0 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, marginBottom: 14, paddingLeft: 10 },
  title: { fontFamily: F.semibold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3, color: G.ink },

  profile: { paddingHorizontal: 16, paddingTop: 11, paddingBottom: 12, gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42 },
  avatarText: { fontFamily: F.semibold, fontSize: 14.5, letterSpacing: 0.2, color: G.navy },
  name: { fontFamily: F.semibold, fontSize: 16, lineHeight: 21, color: G.ink },
  phone: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: G.muted, letterSpacing: 0.3 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 44, paddingTop: 2 },
  action: { alignItems: 'center', gap: 4, minWidth: 52 },
  actionOrb: { width: 38, height: 38 },
  actionLabel: { fontFamily: F.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.2, color: G.navy },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 12, paddingLeft: 8 },
  section: { fontFamily: F.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.2, color: G.ink },

  booking: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingRight: 10, gap: 10, minHeight: 88 },
  dateBlock: { width: 64, paddingVertical: 8 },
  dateDay: { fontFamily: F.semibold, fontSize: 24, lineHeight: 29, letterSpacing: -0.3 },
  dateMonth: { fontFamily: F.medium, fontSize: 9, lineHeight: 12, letterSpacing: 0.4 },
  dateRule: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth, opacity: 0.35, marginHorizontal: 10, marginVertical: 4 },
  dateWeekday: { fontFamily: F.medium, fontSize: 10.5, lineHeight: 13, color: G.muted },

  bookingMid: { flex: 1, minWidth: 0, gap: 4, paddingLeft: 4 },
  bookingName: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, color: G.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaStrong: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: G.ink, flexShrink: 1 },
  meta: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 15, color: G.muted, flexShrink: 1 },
  vRule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: G.rule, marginVertical: 8 },

  bookingRight: { width: 92, alignItems: 'center', gap: 6 },
  amount: { fontFamily: F.semibold, fontSize: 16, lineHeight: 21, color: G.ink },
  pill: { flexDirection: 'row', gap: 5, height: 26, paddingHorizontal: 10 },
  pillText: { fontFamily: F.medium, fontSize: 10, letterSpacing: 0.6 },
}),
);
