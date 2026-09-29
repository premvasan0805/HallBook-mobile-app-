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
import { F } from '@/lib/theme';

/** Blue glass palette, shared with Home and the Customers list. */
const INK = '#131D38';
const NAVY = '#1F3A70';
const BLUE = '#2F63C0';
const MUTED = '#5B6275';

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

  return (
    <Screen
      tab={tab}
      header={<GlassBrandHeader hallIcon="bank" />}
      backdrop={<GlassBackdrop />}
      contentStyle={st.content}>
      <View style={st.titleRow}>
        <Touchable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={INK} />
        </Touchable>
        <Text style={st.title}>Customer</Text>
        <DiamondRule width={96} at={0.9} />
      </View>

      {!cust ? (
        <ErrorState title="Customer not found" />
      ) : (
        <>
          <View style={[st.profile, glassSurface('rgba(255, 255, 255, 0.5)', 22)]}>
            <Sheen radius={22} strength={0.55} />
            <View style={st.who}>
              <GlossTile from="#F5F9FF" to="#D6E4FA" radius={25} style={st.avatar}>
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
                <Action tone={ACTION.call} icon="call" label="Call" onPress={() => Linking.openURL(`tel:${phone}`)} />
                <Action
                  tone={ACTION.whatsapp}
                  icon="logo-whatsapp"
                  label="WhatsApp"
                  onPress={() => Linking.openURL(`https://wa.me/91${phone}`)}
                />
                <Action
                  tone={ACTION.sms}
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
  return (
    <View style={st.sectionRow}>
      <MaterialCommunityIcons name="calendar-month-outline" size={24} color={BLUE} />
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
        fill="rgba(255, 255, 255, 0.9)"
        stroke={BLUE}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Tone = { fg: string; from: string; to: string; glow: string };

/** Quick actions: each orb carries its own tint and a soft coloured halo. */
const ACTION: Record<'call' | 'whatsapp' | 'sms', Tone> = {
  call: { fg: '#1B8A55', from: '#F4FCF7', to: '#D3F0E0', glow: 'rgba(60, 190, 120, 0.35)' },
  whatsapp: { fg: '#5A34C8', from: '#F9F6FF', to: '#E4DAFA', glow: 'rgba(140, 100, 240, 0.35)' },
  sms: { fg: '#2266D8', from: '#F5F9FF', to: '#D7E5FB', glow: 'rgba(80, 140, 240, 0.35)' },
};

function Action({ tone, icon, label, onPress }: { tone: Tone; icon: IconName; label: string; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={st.action}>
      <GlossTile
        from={tone.from}
        to={tone.to}
        radius={22}
        style={[
          st.actionOrb,
          {
            boxShadow: `inset 0px 1.5px 0px rgba(255, 255, 255, 1), inset 0px 0px 10px rgba(255, 255, 255, 0.8), 0px 0px 0px 1px rgba(255, 255, 255, 0.6), 0px 0px 16px ${tone.glow}, 0px 4px 10px rgba(31, 58, 112, 0.1)`,
          },
        ]}>
        <Ionicons name={icon} size={20} color={tone.fg} />
      </GlossTile>
      <Text style={st.actionLabel}>{label}</Text>
    </Touchable>
  );
}

/** Date-block tint: cancelled bookings go rose, the rest follow their slot. */
const DATE_TONE: Record<SlotKey | 'cancelled', { fg: string; from: string; to: string }> = {
  full: { fg: '#1F3F92', from: '#EEF4FE', to: '#DCE8FA' },
  first: { fg: '#9A5A12', from: '#FEF7EC', to: '#F8E7C9' },
  second: { fg: '#3B2E9A', from: '#F3F0FD', to: '#E1DAF7' },
  early: { fg: '#16704A', from: '#EEF9F3', to: '#D5EFE2' },
  cancelled: { fg: '#8E1F3F', from: '#FDF1F4', to: '#F8DCE4' },
};

const SLOT_ICON: Record<SlotKey, { name: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  full: { name: 'white-balance-sunny', color: '#F2A516' },
  first: { name: 'weather-sunny', color: '#EE8A1A' },
  second: { name: 'moon-waning-crescent', color: '#6A48D8' },
  early: { name: 'weather-sunset-up', color: '#F2A516' },
};

const PAY_PILL: Record<PayState, { label: string; icon: IconName; fg: string; from: string; to: string }> = {
  cancelled: { label: 'CANCELLED', icon: 'close-circle-outline', fg: '#D42A45', from: '#FFF1F4', to: '#FBD9E0' },
  paid: { label: 'PAID', icon: 'checkmark-circle-outline', fg: '#1F7A4A', from: '#EFFAF4', to: '#CDEBDA' },
  due: { label: 'DUE', icon: 'time-outline', fg: '#C07A0C', from: '#FFF8E8', to: '#F8E6BC' },
  unpaid: { label: 'UNPAID', icon: 'alarm-outline', fg: '#D42A45', from: '#FFF1F4', to: '#FBD9E0' },
};

/** Booking card: tinted date block, slot and booked-on date, then amount and payment state. */
function BookingRow({ booking, name }: { booking: Booking; name: string }) {
  const d = parseISO(booking.date);
  const state = payState(booking);
  const pill = PAY_PILL[state];
  const tone = DATE_TONE[state === 'cancelled' ? 'cancelled' : booking.slot];
  const slotIcon = SLOT_ICON[booking.slot];

  return (
    <Touchable
      onPress={() => openBooking(booking.id)}
      accessibilityRole="button"
      accessibilityLabel={`${fmtDate(booking.date)}, ${SLOT_LABEL[booking.slot]}, ${inr(booking.total)}, ${pill.label}`}
      style={[st.booking, glassSurface('rgba(255, 255, 255, 0.55)', 20)]}>
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
          <Ionicons name="document-text-outline" size={15} color={NAVY} />
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
      <Ionicons name="chevron-forward" size={18} color={INK} />
    </Touchable>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 0, gap: 0 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, marginBottom: 14, paddingLeft: 10 },
  title: { fontFamily: F.pageSerifBold, fontSize: 26, lineHeight: 34, letterSpacing: -0.5, color: INK },

  profile: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, gap: 10 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 50, height: 50 },
  avatarText: { fontFamily: F.pageSerifBold, fontSize: 17, color: '#1F4488' },
  name: { fontFamily: F.bold, fontSize: 17, lineHeight: 22, color: INK },
  phone: { fontFamily: F.regular, fontSize: 15, lineHeight: 20, color: MUTED, letterSpacing: 0.8 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 52, paddingTop: 4 },
  action: { alignItems: 'center', gap: 6, minWidth: 56 },
  actionOrb: { width: 44, height: 44 },
  actionLabel: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: '#3A4258' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 12, paddingLeft: 8 },
  section: { fontFamily: F.pageSerifBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: INK },

  booking: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingRight: 10, gap: 10, minHeight: 88 },
  dateBlock: { width: 64, paddingVertical: 8 },
  /** Lining figures — Cormorant defaults to old-style digits that dip below the baseline. */
  dateDay: { fontFamily: F.serifBold, fontSize: 28, lineHeight: 31, fontVariant: ['lining-nums'] },
  dateMonth: { fontFamily: F.medium, fontSize: 9, letterSpacing: 0.2 },
  dateRule: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth, opacity: 0.35, marginHorizontal: 10, marginVertical: 4 },
  dateWeekday: { fontFamily: F.regular, fontSize: 10.5, lineHeight: 13, color: MUTED },

  bookingMid: { flex: 1, minWidth: 0, gap: 4, paddingLeft: 4 },
  bookingName: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20, color: INK },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaStrong: { fontFamily: F.regular, fontSize: 13.5, color: '#2C3550', flexShrink: 1 },
  meta: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 15, color: MUTED, flexShrink: 1 },
  vRule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(31, 58, 112, 0.16)', marginVertical: 8 },

  bookingRight: { width: 92, alignItems: 'center', gap: 6 },
  amount: { fontFamily: F.bold, fontSize: 15, lineHeight: 20, color: INK },
  pill: { flexDirection: 'row', gap: 5, height: 26, paddingHorizontal: 10 },
  pillText: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.3 },
});
