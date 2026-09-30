import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MonthPicker, shiftMonth, type YM } from '@/components/calendar';
import { GradientFill, glassSurface, Sheen } from '@/components/glass';
import { Touchable } from '@/components/primitives';
import { fmtClock, fmtFull, inr, MONTHS, parseISO, toISO, todayISO } from '@/lib/format';
import {
  CATEGORY_LABEL,
  SLOT_SEGMENTS,
  useStore,
  type Booking,
  type SegmentKey,
  type SegState,
  type SlotKey,
} from '@/lib/store';
import { F, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/** Gold line-art wedding scene (mandapam, couple, priest, temples) for the foot of the date strip. */
const MANDAP_SCENE = require('../../assets/images/home/mandap-scene.png');

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** One dot per day segment (early / late / evening), in that order. */
const dotTone = (t: Theme): Record<SegState, string> => ({
  free: t.S.vacant,
  booked: t.S.booked,
  tentative: t.S.tentative,
  blocked: t.S.blocked,
});

/** Filled blue of the selected day and the date strip: muted, but deep enough to carry white text. */
const selFill = (t: Theme) => (t.dark ? { from: t.G.gradFrom, to: t.G.gradTo } : { from: t.G.blue, to: t.G.deep });

/** Translucent day-cell tints over the glass board. Priority: muhurtham > special > fully blocked > partly booked > weekend. */
const tints = (t: Theme) =>
  t.dark
    ? {
        muhurtham: 'rgba(201, 164, 94, 0.16)',
        special: 'rgba(183, 162, 224, 0.15)',
        blocked: 'rgba(138, 148, 166, 0.14)',
        partly: 'rgba(232, 138, 138, 0.13)',
        weekend: 'rgba(183, 162, 224, 0.08)',
        plain: t.frost(0.78),
        outside: t.frost(0.35),
      }
    : {
        muhurtham: 'rgba(250, 241, 222, 0.9)',
        special: 'rgba(242, 238, 250, 0.9)',
        blocked: 'rgba(234, 238, 245, 0.9)',
        partly: 'rgba(250, 230, 235, 0.9)',
        weekend: 'rgba(242, 240, 250, 0.85)',
        plain: t.frost(0.78),
        outside: t.frost(0.35),
      };

/** Day-mark and legend icon colours. */
const marks = (t: Theme) => ({
  special: t.dark ? '#C3A6E0' : '#7A3E9A',
  weekend: t.dark ? '#B7A2E0' : '#8A5AAE',
  moon: t.G.blue,
  leaf: t.dark ? '#7FC795' : '#3E9A5A',
  /** Leaf on the selected (blue) day, same in both themes. */
  leafOnBlue: '#B5E6C0',
  /** Gold marks on the selected (blue) day. */
  selGold: t.C.accentOnPrimary,
});

/** Waxing (valarpirai) or waning (theipirai) moon phase for a date. */
export function lunarPhase(types: string[]) {
  return types.includes('valarpirai')
    ? { key: 'valarpirai' as const, label: 'Valarpirai' }
    : { key: 'theipirai' as const, label: 'Theipirai' };
}

/** The small mark before a date: special > weekend > moon phase. */
function DayMark({ special, weekend, waxing, light }: { special: boolean; weekend: boolean; waxing: boolean; light: boolean }) {
  const t = useTheme();
  const m = marks(t);
  if (special) return <MaterialCommunityIcons name="asterisk" size={10} color={light ? t.G.onBlue : m.special} />;
  if (weekend)
    return <MaterialCommunityIcons name="calendar-month-outline" size={10} color={light ? t.G.onBlue : m.weekend} />;
  if (waxing) return <Ionicons name="leaf-outline" size={10} color={light ? m.leafOnBlue : m.leaf} />;
  return <MaterialCommunityIcons name="moon-waning-crescent" size={10} color={light ? m.selGold : m.moon} />;
}

// ---------- Month board ----------

export function CalendarBoard({
  ym,
  onChangeYm,
  selected,
  onSelect,
}: {
  ym: YM;
  onChangeYm: (v: YM) => void;
  selected: string;
  onSelect: (iso: string) => void;
}) {
  const t = useTheme();
  const st = useSt();
  const { typesFor, segmentState, segments } = useStore();
  const [picker, setPicker] = useState(false);
  const today = todayISO();
  const TINT = tints(t);
  const DOT = dotTone(t);
  const mk = marks(t);
  const sel = selFill(t);

  // Leading/trailing days from the neighbouring months fill the first and last weeks.
  const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i) => new Date(ym.y, ym.m, i - lead + 1));

  return (
    <View>
      <View style={[st.inner, glassSurface(t, t.frost(0.5), 22)]}>
        <Sheen radius={22} strength={0.45} height="30%" />
        <View style={st.monthRow}>
          <NavButton icon="chevron-back" label="Previous month" onPress={() => onChangeYm(shiftMonth(ym, -1))} />
          <Touchable style={st.monthTitle} onPress={() => setPicker(true)} accessibilityLabel="Choose month">
            <Text style={st.monthText}>
              {MONTHS[ym.m]} {ym.y}
            </Text>
            <Ionicons name="chevron-down" size={16} color={t.G.ink} />
          </Touchable>
          <NavButton icon="chevron-forward" label="Next month" onPress={() => onChangeYm(shiftMonth(ym, 1))} />
        </View>

        <View style={st.row}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={st.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={{ gap: 7 }}>
          {Array.from({ length: total / 7 }, (_, r) => (
            <View key={r} style={st.row}>
              {cells.slice(r * 7, r * 7 + 7).map((date, i) => {
                const iso = toISO(date);
                if (date.getMonth() !== ym.m) {
                  return (
                    <Touchable
                      key={iso}
                      onPress={() => onSelect(iso)}
                      accessibilityLabel={fmtFull(iso)}
                      style={[st.cell, st.cellOutside]}>
                      <Text style={st.numOutside}>{date.getDate()}</Text>
                    </Touchable>
                  );
                }
                const types = typesFor(iso);
                const seg = segmentState(iso);
                const states = segments.map((s) => seg[s.key]);
                const muhurtham = types.includes('muhurtham');
                const special = types.includes('special');
                const weekend = i >= 5;
                const allBlocked = states.every((s) => s === 'blocked');
                const partly = states.some((s) => s === 'booked' || s === 'tentative') && states.includes('free');
                const tint = muhurtham
                  ? TINT.muhurtham
                  : special
                    ? TINT.special
                    : allBlocked
                      ? TINT.blocked
                      : partly
                        ? TINT.partly
                        : weekend
                          ? TINT.weekend
                          : TINT.plain;
                const isSel = iso === selected;
                const isToday = iso === today;
                return (
                  <Touchable
                    key={iso}
                    onPress={() => onSelect(iso)}
                    accessibilityLabel={fmtFull(iso)}
                    accessibilityState={{ selected: isSel }}
                    style={[
                      st.cell,
                      { backgroundColor: tint },
                      st.cellGlass,
                      isToday && !isSel && st.cellToday,
                      isSel && st.cellSelected,
                    ]}>
                    {isSel ? (
                      <>
                        <GradientFill from={sel.from} to={sel.to} radius={10} />
                        <Sheen radius={10} strength={0.3} height="50%" />
                        <View style={st.selRing} pointerEvents="none" />
                      </>
                    ) : null}
                    <View style={st.mark} pointerEvents="none">
                      <DayMark special={special} weekend={weekend} waxing={types.includes('valarpirai')} light={isSel} />
                    </View>
                    {muhurtham ? (
                      <Ionicons name="star" size={12} color={isSel ? mk.selGold : t.C.accent} style={st.star} />
                    ) : null}
                    <Text style={[st.num, isSel && { color: t.G.onBlue }]}>{date.getDate()}</Text>
                    <View style={st.dots}>
                      {states.map((s, k) => (
                        <View key={k} style={[st.dot, { backgroundColor: DOT[s] }]} />
                      ))}
                    </View>
                  </Touchable>
                );
              })}
            </View>
          ))}
        </View>

        <Legend />
      </View>

      <MonthPicker
        key={String(picker)}
        visible={picker}
        value={ym}
        onClose={() => setPicker(false)}
        onPick={(v) => {
          onChangeYm(v);
          setPicker(false);
        }}
      />
    </View>
  );
}

function NavButton({ icon, label, onPress }: { icon: 'chevron-back' | 'chevron-forward'; label: string; onPress: () => void }) {
  const t = useTheme();
  const st = useSt();
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={st.nav}>
      <Ionicons name={icon} size={18} color={t.G.navy} />
    </Touchable>
  );
}

function Legend() {
  const t = useTheme();
  const st = useSt();
  const mk = marks(t);
  const items: { label: string; icon: ReactNode }[] = [
    { label: 'Muhurtham', icon: <Ionicons name="star" size={14} color={t.C.accent} /> },
    { label: 'Valarpirai', icon: <Ionicons name="leaf-outline" size={14} color={mk.leaf} /> },
    { label: 'Theipirai', icon: <MaterialCommunityIcons name="moon-waning-crescent" size={14} color={mk.moon} /> },
    { label: 'Special', icon: <MaterialCommunityIcons name="asterisk" size={14} color={mk.special} /> },
    { label: 'Weekend', icon: <MaterialCommunityIcons name="calendar-month-outline" size={15} color={mk.weekend} /> },
  ];
  const dots = [
    { label: 'Vacant', color: t.S.vacant },
    { label: 'Booked', color: t.S.booked },
    { label: 'Tentative', color: t.S.tentative },
    { label: 'Blocked', color: t.S.blocked },
    { label: 'Partly Booked', color: t.S.partial },
  ];
  return (
    <View style={st.legend}>
      <View style={st.legendRow}>
        {items.map((m) => (
          <View key={m.label} style={st.legendItem}>
            {m.icon}
            <Text style={st.legendText}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={st.legendRule} />
      <View style={st.legendRow}>
        {dots.map((d) => (
          <View key={d.label} style={st.legendItem}>
            <View style={[st.legendDot, { backgroundColor: d.color }]} />
            <Text style={st.legendText}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- Selected day ----------

type SegIcon =
  | { lib: 'mci'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] }
  | { lib: 'ion'; name: ComponentProps<typeof Ionicons>['name'] };

const SEG_ICON: Record<SegmentKey, SegIcon> = {
  early: { lib: 'mci', name: 'weather-sunset-up' },
  late: { lib: 'ion', name: 'sunny-outline' },
  evening: { lib: 'ion', name: 'moon-outline' },
};

/** The booking slot a segment's "Book" button starts. */
const SEG_SLOT: Record<SegmentKey, SlotKey> = { early: 'early', late: 'first', evening: 'second' };

const statePill = (t: Theme): Record<SegState, { label: string; fg: string; bg: string }> => ({
  free: { label: 'Vacant', fg: t.S.vacant, bg: t.S.vacantSoft },
  booked: { label: 'Booked', fg: t.S.booked, bg: t.S.bookedSoft },
  tentative: { label: 'Tentative', fg: t.S.tentativeText, bg: t.S.tentativeSoft },
  blocked: { label: 'Blocked', fg: t.S.blocked, bg: t.S.blockedSoft },
});

/** Grows the slot buttons to a 44pt touch target without changing their look. */
const BTN_SLOP = { top: 8, bottom: 8, left: 4, right: 4 };

/**
 * The selected-day card is laid out on a 1405px-wide reference; `u(px)` maps a reference pixel to dp
 * so the card keeps the design's proportions at any width.
 */
const DAY_REF_W = 1405;
const DATE_COL_W = 282;

/** Colors traced from the day-card design. */
const dayTone = (t: Theme) => ({
  ink: t.G.ink,
  muted: t.G.muted,
  rate: t.G.ink,
  gold: t.C.accentOnPrimary,
  goldLine: t.dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.75)',
  iconBox: t.C.accentSoft,
  icon: t.tone.sand.fg,
  vacantBg: t.S.vacantSoft,
  vacantFg: t.dark ? t.S.vacant : '#23613F',
  leaf: t.dark ? '#A9C98A' : '#4A6A1E',
  chipFg: t.dark ? '#9FD3AE' : '#1E4F24',
});

/** Box top that puts an Inter line of size `fs` (line height 1.2·fs) on baseline `b`. */
const sansTop = (b: number, fs: number) => b - 0.963 * fs;

export function DayDetail({
  iso,
  onBook,
  onOpenBooking,
}: {
  iso: string;
  onBook: (slot: SlotKey) => void;
  onOpenBooking: (b: Booking) => void;
}) {
  const t = useTheme();
  const st = useSt();
  const DAY = dayTone(t);
  const TINT = tints(t);
  const STATE_PILL = statePill(t);
  const mk = marks(t);
  const sel = selFill(t);
  const { typesFor, segmentState, segments, categoryFor, priceFor, bookingsOn } = useStore();
  const [cardWidth, setCardWidth] = useState(0);
  const d = parseISO(iso);
  const types = typesFor(iso);
  const phase = lunarPhase(types);
  const waxing = phase.key === 'valarpirai';
  const seg = segmentState(iso);
  const list = bookingsOn(iso);
  const u = (px: number) => (cardWidth / DAY_REF_W) * px;
  const sans = (b: number, fs: number, family: string = F.semibold) => ({
    top: u(sansTop(b, fs)),
    fontFamily: family,
    fontSize: u(fs),
    lineHeight: u(fs * 1.2),
  });
  const tags = types.includes('muhurtham') || types.includes('special');
  const tag = { height: u(64), borderRadius: u(32), gap: u(10), paddingHorizontal: u(28) };
  const tagText = { fontSize: u(36), lineHeight: u(46), letterSpacing: u(1) };

  return (
    <View style={[st.detail, glassSurface(t, t.frost(0.52), cardWidth ? u(34) : 20)]} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
      {cardWidth > 0 ? (
        <>
          {/* Date strip: day, month, weekday, moon phase, mandap line art */}
          <View style={[st.dateCol, { width: u(DATE_COL_W) }]}>
            <GradientFill from={sel.from} to={sel.to} radius={0} fromOpacity={t.dark ? 0.34 : 0.3} toOpacity={t.dark ? 0.2 : 0.16} />
            <Sheen radius={0} strength={0.25} height="40%" />
            <Image
              source={MANDAP_SCENE}
              contentFit="contain"
              tintColor={t.G.blue}
              pointerEvents="none"
              style={{ position: 'absolute', left: -u(38), bottom: 0, width: u(358), height: u(251), opacity: t.dark ? 0.35 : 0.4 }}
            />
            <Text style={[st.colText, sans(183, 148), { letterSpacing: -u(3), color: t.G.ink, fontVariant: ['lining-nums'] }]}>{d.getDate()}</Text>
            <Text style={[st.colText, sans(251, 42, F.medium), { letterSpacing: u(3), color: t.G.deep, fontVariant: ['lining-nums'] }]}>
              {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
            </Text>
            <Text style={[st.colText, sans(313, 44, F.medium), { color: t.G.ink }]}>{WEEKDAY_LONG[d.getDay()]}</Text>
            <View
              style={{
                position: 'absolute',
                top: u(362),
                left: u((DATE_COL_W - 97) / 2),
                width: u(97),
                height: Math.max(u(4), 1),
                backgroundColor: t.G.blue,
              }}
            />
            <View style={[st.colIcon, { top: u(404), height: u(80) }]}>
              {waxing ? (
                <Ionicons name="leaf-outline" size={u(72)} color={t.G.blue} />
              ) : (
                <MaterialCommunityIcons name="moon-waning-crescent" size={u(72)} color={t.G.blue} />
              )}
            </View>
            <Text style={[st.colText, sans(521, 40, F.medium), { color: t.G.ink }]}>{phase.label}</Text>
          </View>

          <View style={{ flex: 1, paddingLeft: u(31), paddingRight: u(34), paddingBottom: u(40) }}>
            {/* Title, phase chip, booking count and rate */}
            <View style={{ height: u(218) }}>
              <Text
                numberOfLines={1}
                style={[st.abs, sans(103, 62), { letterSpacing: -u(1), left: u(11), right: u(330), color: DAY.ink, fontVariant: ['lining-nums'] }]}>
                {fmtFull(iso)}
              </Text>
              <View
                style={[
                  st.abs,
                  st.chip,
                  { top: u(35), right: u(3), width: u(290), height: u(73), borderRadius: u(37), gap: u(14) },
                  !waxing && { backgroundColor: t.D.theipirai.bg },
                ]}>
                {waxing ? (
                  <Ionicons name="leaf-outline" size={u(50)} color={DAY.leaf} />
                ) : (
                  <MaterialCommunityIcons name="moon-waning-crescent" size={u(50)} color={mk.moon} />
                )}
                <Text style={{ fontFamily: F.medium, fontSize: u(38), lineHeight: u(48), color: waxing ? DAY.chipFg : t.D.theipirai.fg }}>
                  {phase.label}
                </Text>
              </View>
              <Text
                style={[
                  st.abs,
                  { left: u(11), top: u(sansTop(176, 41)), fontFamily: F.regular, fontSize: u(41), lineHeight: u(49), color: DAY.muted },
                ]}>
                {list.length === 0 ? 'No bookings' : `${list.length} booking${list.length > 1 ? 's' : ''}`}
              </Text>
              <View style={[st.abs, st.rateRow, { top: u(sansTop(180, 62)), right: u(8), gap: u(38) }]}>
                <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: u(40), lineHeight: u(50), color: DAY.muted }}>
                  {CATEGORY_LABEL[categoryFor(iso)]} rate
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: F.semibold, fontSize: u(62), lineHeight: u(74), letterSpacing: -u(1), color: DAY.rate, fontVariant: ['lining-nums'] }}>
                  {inr(priceFor(iso, 'full'))}
                </Text>
              </View>
            </View>

            {tags ? (
              <View style={[st.tagRow, { gap: u(18), marginTop: -u(8), marginBottom: u(20), paddingLeft: u(11) }]}>
                {types.includes('muhurtham') ? (
                  <View style={[st.chip, tag, { backgroundColor: t.D.muhurtham.bg }]}>
                    <Ionicons name="star" size={u(40)} color={t.C.accent} />
                    <Text style={[st.tagText, tagText, { color: t.D.muhurtham.fg }]}>Muhurtham</Text>
                  </View>
                ) : null}
                {types.includes('special') ? (
                  <View style={[st.chip, tag, { backgroundColor: TINT.special }]}>
                    <MaterialCommunityIcons name="asterisk" size={u(40)} color={mk.special} />
                    <Text style={[st.tagText, tagText, { color: mk.special }]}>Special</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Segment rows: icon, name and time, status pill, action */}
            <View style={{ gap: u(22) }}>
              {segments.map((s) => {
                const state = seg[s.key];
                const pill = STATE_PILL[state];
                const slot = SEG_SLOT[s.key];
                const bookable = state === 'free' && SLOT_SEGMENTS[slot].every((k) => seg[k] === 'free');
                const booking = list.find((b) => SLOT_SEGMENTS[b.slot].includes(s.key));
                const icon = SEG_ICON[s.key];
                const btn = { width: u(247), height: u(97), borderRadius: u(20), gap: u(34) };
                const btnText = { fontSize: u(46), lineHeight: u(56) };
                const action =
                  state === 'free' ? (
                    <Touchable
                      onPress={() => onBook(slot)}
                      disabled={!bookable}
                      accessibilityRole="button"
                      accessibilityLabel={`Book ${s.label}`}
                      hitSlop={BTN_SLOP}
                      style={[st.actBtn, btn]}>
                      <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={u(20)} />
                      <Sheen radius={u(20)} strength={0.3} height="50%" />
                      <Ionicons name="add" size={u(66)} color={t.G.onBlue} />
                      <Text style={[st.actText, btnText]}>Book</Text>
                    </Touchable>
                  ) : booking ? (
                    <Touchable
                      onPress={() => onOpenBooking(booking)}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${s.label} booking`}
                      hitSlop={BTN_SLOP}
                      style={[st.actBtn, btn, st.viewBtn, { gap: u(14) }]}>
                      <Text style={[st.actText, btnText, { color: t.G.deep }]}>View</Text>
                      <Ionicons name="chevron-forward" size={u(48)} color={t.G.deep} />
                    </Touchable>
                  ) : (
                    <View style={btn} />
                  );
                return (
                  <View
                    key={s.key}
                    style={[st.slot, glassSurface(t, t.frost(0.7), u(28)), { height: u(175), paddingLeft: u(18), paddingRight: u(20) }]}>
                    <View style={[st.slotIcon, { width: u(112), height: u(120), borderRadius: u(24) }]}>
                      {icon.lib === 'mci' ? (
                        <MaterialCommunityIcons name={icon.name} size={u(80)} color={DAY.icon} />
                      ) : (
                        <Ionicons name={icon.name} size={u(72)} color={DAY.icon} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, marginLeft: u(26) }}>
                      <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: u(48), lineHeight: u(58), color: DAY.ink }}>
                        {s.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: F.regular,
                          fontSize: u(38.5),
                          lineHeight: u(48),
                          color: DAY.muted,
                          marginTop: u(6),
                        }}>
                        {fmtClock(s.start)} – {fmtClock(s.end)}
                      </Text>
                    </View>
                    <View
                      style={[
                        st.pill,
                        { width: u(174), height: u(72), borderRadius: u(16), marginRight: u(29) },
                        { backgroundColor: state === 'free' ? DAY.vacantBg : pill.bg },
                      ]}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: F.medium,
                          fontSize: u(state === 'free' ? 38 : 33),
                          lineHeight: u(48),
                          color: state === 'free' ? DAY.vacantFg : pill.fg,
                        }}>
                        {pill.label}
                      </Text>
                    </View>
                    {action}
                  </View>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    inner: { paddingHorizontal: 10, paddingTop: 12, paddingBottom: 12 },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },
    nav: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.frost(0.72),
      borderWidth: 1.5,
      borderColor: t.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 4px 10px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.85), 0px 3px 8px rgba(30, 30, 30, 0.08)',
    },
    monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
    monthText: { fontFamily: F.semibold, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: t.G.ink, fontVariant: ['lining-nums'] },
    row: { flexDirection: 'row', gap: 5 },
    weekday: {
      flex: 1,
      textAlign: 'center',
      fontFamily: F.medium,
      fontSize: 11,
      letterSpacing: 0.3,
      color: t.G.muted,
      paddingBottom: 7,
    },
    /** Wider than tall, like the printed wall calendars halls keep at the desk. */
    cell: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      overflow: 'hidden',
    },
    /** Frosted tile: soft top rim, faint drop shadow. */
    cellGlass: {
      borderWidth: 1,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.08)' : t.glassBorder,
      boxShadow: t.dark
        ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.05)'
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.85), 0px 2px 6px rgba(30, 30, 30, 0.06)',
    },
    cellOutside: {
      backgroundColor: tints(t).outside,
      borderWidth: 1,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.6)',
    },
    cellToday: { borderWidth: 1.5, borderColor: t.G.blue },
    cellSelected: {
      borderWidth: 1.5,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.22)' : t.G.deep,
      boxShadow: t.dark ? `0px 4px 12px ${t.shadow}` : '0px 4px 10px rgba(61, 105, 176, 0.28)',
    },
    selRing: {
      position: 'absolute',
      top: 2,
      left: 2,
      right: 2,
      bottom: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.35)',
    },
    mark: { position: 'absolute', top: 8, left: 4 },
    num: { fontFamily: F.semibold, fontSize: 12.5, lineHeight: 15, color: t.G.ink, paddingLeft: 3 },
    numOutside: { fontFamily: F.regular, fontSize: 12.5, color: t.textMuted },
    star: { position: 'absolute', top: 5, right: 4 },
    dots: { flexDirection: 'row', gap: 3.5 },
    dot: { width: 5.5, height: 5.5, borderRadius: 3 },

    legend: {
      marginTop: 12,
      backgroundColor: t.frost(0.5),
      borderWidth: 1,
      borderColor: t.glassBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6, columnGap: 4 },
    legendRule: { height: 1, backgroundColor: t.G.rule, marginVertical: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendText: { fontFamily: F.regular, fontSize: 10, color: t.G.ink },
    legendDot: { width: 10, height: 10, borderRadius: 5 },

    detail: { flexDirection: 'row', minHeight: 200, overflow: 'hidden' },
    /** Gold-tinted glass strip: the pane shows through; gold is only a light wash plus accents. */
    dateCol: {
      alignSelf: 'stretch',
      overflow: 'hidden',
      borderRightWidth: 1,
      borderRightColor: t.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.6)',
    },
    rateRow: { flexDirection: 'row', alignItems: 'baseline' },
    colText: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
    colIcon: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
    abs: { position: 'absolute' },
    chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: t.S.vacantSoft },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
    tagText: { fontFamily: F.medium },
    slot: { flexDirection: 'row', alignItems: 'center' },
    slotIcon: { backgroundColor: t.C.accentSoft, alignItems: 'center', justifyContent: 'center' },
    pill: { alignItems: 'center', justifyContent: 'center' },
    actBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
    },
    viewBtn: { backgroundColor: t.frost(0.8), borderColor: t.G.deep, boxShadow: 'none' },
    actText: { fontFamily: F.semibold, color: t.G.onBlue },
  }),
);
