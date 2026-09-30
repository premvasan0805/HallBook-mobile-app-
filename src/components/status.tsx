import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Card, type IconName } from '@/components/primitives';
import { inr, initials } from '@/lib/format';
import { balanceOf, payState, type Booking, type BookingStatus, type DateType } from '@/lib/store';
import { F, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'brand';
const tones = ({ C }: Theme): Record<Tone, { bg: string; fg: string }> => ({
  success: { bg: C.successSoft, fg: C.success },
  warning: { bg: C.warningSoft, fg: C.warning },
  danger: { bg: C.dangerSoft, fg: C.danger },
  neutral: { bg: C.surfaceAlt, fg: C.textSecondary },
  info: { bg: C.infoSoft, fg: C.info },
  brand: { bg: C.primarySoft, fg: C.primary },
});

export function StatusBadge({ label, tone, style }: { label: string; tone: Tone; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const st = useSt();
  const c = tones(t)[tone];
  return (
    <View style={[st.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[st.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/** PAID / DUE ₹x / UNPAID / CANCELLED — the one payment badge used everywhere. */
export function PaymentBadge({ booking }: { booking: Booking }) {
  const s = payState(booking);
  if (s === 'cancelled') return <StatusBadge label="CANCELLED" tone="danger" />;
  if (s === 'paid') return <StatusBadge label="PAID" tone="success" />;
  if (s === 'unpaid') return <StatusBadge label="UNPAID" tone="neutral" />;
  return <StatusBadge label={`DUE ${inr(balanceOf(booking))}`} tone="warning" />;
}

const BOOKING_TONE: Record<BookingStatus, Tone> = {
  confirmed: 'success',
  tentative: 'warning',
  enquiry: 'info',
  cancelled: 'danger',
};
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge label={status.toUpperCase()} tone={BOOKING_TONE[status]} />;
}

/** Important-date category colours — kept separate from booking-availability colours. */
export const dateTone = ({ D }: Theme): Record<DateType, { fg: string; bg: string }> => ({
  muhurtham: D.muhurtham,
  valarpirai: D.valarpirai,
  special: D.special,
  holiday: D.holiday,
});

export const EVENT_ICON: Record<string, IconName> = {
  Wedding: 'heart-outline',
  Engagement: 'diamond-outline',
  Party: 'sparkles-outline',
  'Family Function': 'people-outline',
  Reception: 'wine-outline',
  'Company Function': 'business-outline',
};

export function EventIcon({ type, size = 44 }: { type: string; size?: number }) {
  const t = useTheme();
  const st = useSt();
  return (
    <View style={[st.eventIcon, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Ionicons name={EVENT_ICON[type] ?? 'calendar-clear-outline'} size={size * 0.45} color={t.C.primary} />
    </View>
  );
}

const avatarBg = ({ C, tone }: Theme) => [C.primarySoft, C.accentSoft, tone.violet.to, tone.peach.to, tone.slate.to];
const avatarFg = ({ C, tone }: Theme) => [C.primary, C.accentText, tone.violet.fg, tone.peach.fg, tone.slate.fg];

export function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  const t = useTheme();
  const st = useSt();
  const AVATAR_BG = avatarBg(t);
  const AVATAR_FG = avatarFg(t);
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length;
  return (
    <View style={[st.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_BG[i] }]}>
      <Text style={{ fontFamily: F.semibold, fontSize: size * 0.34, letterSpacing: 0.2, color: AVATAR_FG[i] }}>{initials(name)}</Text>
    </View>
  );
}

export function AmountDisplay({
  label,
  value,
  color,
  size = 'md',
}: {
  label: string;
  value: number;
  color?: string;
  size?: 'md' | 'lg';
}) {
  const { T } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={T.caption}>{label}</Text>
      <Text style={[size === 'lg' ? T.amount : T.amountSm, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {inr(value)}
      </Text>
    </View>
  );
}

export function SummaryCard({
  icon,
  value,
  label,
  tint,
  onPress,
}: {
  icon: IconName;
  value: string;
  label: string;
  tint: { fg: string; bg: string };
  onPress?: () => void;
}) {
  const { T } = useTheme();
  const st = useSt();
  return (
    <Card style={st.summary} onPress={onPress}>
      <View style={[st.summaryIcon, { backgroundColor: tint.bg }]}>
        <Ionicons name={icon} size={20} color={tint.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[T.amountSm, { fontFamily: F.semibold, fontSize: 17, letterSpacing: -0.2 }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={T.caption} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Card>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontFamily: F.medium, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.5 },
    eventIcon: { backgroundColor: t.C.primarySoft, alignItems: 'center', justifyContent: 'center' },
    avatar: { alignItems: 'center', justifyContent: 'center' },
    summary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    summaryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  }),
);
