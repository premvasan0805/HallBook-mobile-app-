import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { openBooking } from '@/components/cards';
import { GlossTile, glassTier, Sheen } from '@/components/glass';
import { Touchable } from '@/components/primitives';
import { fmtClock, inr, MONTHS, parseISO } from '@/lib/format';
import { balanceOf, payState, SLOT_LABEL, useStore, type Booking, type Segment } from '@/lib/store';
import { appWidth, F, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/theme-context';

/**
 * Home's Upcoming Events row — the reference list-row design. Bookings and Customers reuse it so every list looks
 * the same. Sizes come from Home's 903px-wide design reference.
 */
const REF_WIDTH = 903;

/** Reference-px scaler shared by all list rows. `fs` never drops below 11dp. */
export function useRowScale() {
  const { width } = useWindowDimensions();
  const u = (px: number) => (appWidth(width) / REF_WIDTH) * px;
  const fs = (px: number) => Math.max(u(px), 11);
  return { u, fs };
}

/** Space between row cards. */
export const useRowGap = () => useRowScale().u(20);

export function timeLabel(b: Booking, segs: Segment[]) {
  if (b.slot === 'full') return 'All Day';
  const key = b.slot === 'first' ? 'late' : b.slot === 'second' ? 'evening' : 'early';
  const s = segs.find((x) => x.key === key);
  return s ? `${fmtClock(s.start)} - ${fmtClock(s.end)}` : SLOT_LABEL[b.slot];
}

/** Date numeral colour by event type. */
const eventColor = ({ tone }: Theme, type: string) =>
  ({ Party: tone.sand.fg, Wedding: tone.mint.fg, Engagement: tone.peach.fg, Reception: tone.violet.fg })[type] ?? tone.sand.fg;

/** Clear glass tile fill — only the text inside carries colour. */
const clearTile = (t: Theme) => ({ from: t.frost(0.7), to: t.frost(0.4) });

export type PillKind = 'success' | 'warning' | 'danger';

/** Translucent tinted status pill, never a solid badge. */
export function RowPill({ label, kind }: { label: string; kind: PillKind }) {
  const t = useTheme();
  const { u, fs } = useRowScale();
  const a = t.dark ? 0.22 : 0.14;
  const spec = {
    success: { bg: `rgba(63, 143, 107, ${a})`, fg: t.C.success },
    warning: { bg: `rgba(198, 146, 36, ${a + 0.02})`, fg: t.S.tentativeText },
    danger: { bg: `rgba(194, 84, 90, ${a})`, fg: t.C.danger },
  }[kind];
  return (
    <View
      style={{
        paddingHorizontal: u(18),
        paddingVertical: u(3),
        borderRadius: u(22),
        backgroundColor: spec.bg,
        borderWidth: 1,
        borderColor: t.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.55)',
      }}>
      <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: fs(21), lineHeight: fs(28), color: spec.fg, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Row shell: glass card, clear left tile, two text lines (title + right value, subtitle + pill), trailing slot
 * and chevron.
 */
export function RowCard({
  tile,
  title,
  value,
  subtitle,
  pill,
  trailing,
  onPress,
  accessibilityLabel,
}: {
  tile: ReactNode;
  title: string;
  value?: string;
  subtitle: string;
  pill: { label: string; kind: PillKind };
  trailing?: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const t = useTheme();
  const { u, fs } = useRowScale();
  const card: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    ...glassTier(t, 'primary', u(26)),
    minHeight: u(154),
    paddingLeft: u(20),
    paddingRight: u(24),
    gap: u(26),
  };
  const body = (
    <>
      <Sheen radius={u(26)} strength={0.5} />
      <View pointerEvents="none">
        <GlossTile from={clearTile(t).from} to={clearTile(t).to} radius={u(20)} style={{ width: u(104), height: u(108) }}>
          {tile}
        </GlossTile>
      </View>
      <View style={{ flex: 1, paddingVertical: u(16) }} pointerEvents="none">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10) }}>
          <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: u(31), lineHeight: u(40), color: t.G.ink }} numberOfLines={1}>
            {title}
          </Text>
          {value ? (
            <Text style={{ fontFamily: F.semibold, fontSize: u(34), lineHeight: u(42), color: t.G.ink, letterSpacing: -0.2 }}>
              {value}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10), marginTop: u(2) }}>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: fs(25), lineHeight: fs(34), color: t.G.muted }} numberOfLines={1}>
            {subtitle}
          </Text>
          <RowPill label={pill.label} kind={pill.kind} />
        </View>
      </View>
    </>
  );
  const chevron = <Ionicons name="chevron-forward" size={u(30)} color={t.G.navy} pointerEvents="none" />;

  if (!trailing) {
    return (
      <Touchable onPress={onPress} accessibilityLabel={accessibilityLabel} style={card}>
        {body}
        {chevron}
      </Touchable>
    );
  }
  // With a trailing button the card can't be one button (web forbids button-in-button): an overlay takes the tap.
  return (
    <View style={card}>
      <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={StyleSheet.absoluteFill}>
        {null}
      </Touchable>
      {body}
      {trailing}
      {chevron}
    </View>
  );
}

/** Tile text: big coloured line over a small navy line (date + month, or initials). */
export function TileText({ big, small, color }: { big: string; small?: string; color: string }) {
  const t = useTheme();
  const { u, fs } = useRowScale();
  return (
    <>
      <Text style={{ fontFamily: F.semibold, fontSize: u(40), lineHeight: u(48), color, letterSpacing: -0.3, fontVariant: ['lining-nums', 'tabular-nums'] }}>
        {big}
      </Text>
      {small ? (
        <Text style={{ fontFamily: F.medium, fontSize: fs(25), lineHeight: fs(32), color: t.G.navy, letterSpacing: 0.6 }}>{small}</Text>
      ) : null}
    </>
  );
}

export function bookingPill(b: Booking): { label: string; kind: PillKind } {
  switch (payState(b)) {
    case 'cancelled':
      return { label: 'CANCELLED', kind: 'danger' };
    case 'unpaid':
      return { label: 'UNPAID', kind: 'danger' };
    case 'due':
      return { label: `DUE ${inr(balanceOf(b))}`, kind: 'warning' };
    case 'paid':
      return { label: 'PAID', kind: 'success' };
  }
}

/** A booking as a list row: date tile, customer, amount, "Event · time", payment pill. */
export function EventRow({ booking }: { booking: Booking }) {
  const t = useTheme();
  const { customerById, segments } = useStore();
  const name = customerById(booking.customerId)?.name ?? 'Unknown customer';
  const d = parseISO(booking.date);
  const pill = bookingPill(booking);
  return (
    <RowCard
      onPress={() => openBooking(booking.id)}
      accessibilityLabel={`${name}, ${booking.eventType}, ${inr(booking.total)}, ${pill.label}`}
      tile={
        <TileText
          big={String(d.getDate()).padStart(2, '0')}
          small={MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}
          color={eventColor(t, booking.eventType)}
        />
      }
      title={name}
      value={inr(booking.total)}
      subtitle={`${booking.eventType} · ${timeLabel(booking, segments)}`}
      pill={pill}
    />
  );
}
