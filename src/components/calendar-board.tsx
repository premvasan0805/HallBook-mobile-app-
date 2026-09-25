import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MonthPicker, shiftMonth, type YM } from '@/components/calendar';
import { BrandGradient } from '@/components/decor';
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
import { C, D, elevation, F, S } from '@/lib/theme';

/** Gold line-art wedding scene (mandapam, couple, priest, temples) for the foot of the date strip. */
const MANDAP_SCENE = require('../../assets/images/home/mandap-scene.png');

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** One dot per day segment (early / late / evening), in that order. */
const DOT: Record<SegState, string> = {
  free: S.vacant,
  booked: S.booked,
  tentative: S.tentative,
  blocked: S.blocked,
};

/** Day-cell tints. Priority: muhurtham > special > fully blocked > partly booked > weekend. */
const TINT = {
  muhurtham: '#FCF1DE',
  special: '#F1ECFA',
  blocked: '#ECF0F8',
  partly: '#FCEBEE',
  weekend: '#F3F1FB',
  outside: '#F8F5F1',
};
const SPECIAL_FG = '#7A2E9E';
const WEEKEND_FG = '#7065B8';
const PARTLY_DOT = '#F2A7BA';
const MOON_FG = '#6F93D6';
const LEAF_FG = '#3E9A5A';

/** Waxing (valarpirai) or waning (theipirai) moon phase for a date. */
export function lunarPhase(types: string[]) {
  return types.includes('valarpirai')
    ? { key: 'valarpirai' as const, label: 'Valarpirai' }
    : { key: 'theipirai' as const, label: 'Theipirai' };
}

/** The small mark before a date: special > weekend > moon phase. */
function DayMark({ special, weekend, waxing, light }: { special: boolean; weekend: boolean; waxing: boolean; light: boolean }) {
  if (special) return <MaterialCommunityIcons name="asterisk" size={10} color={light ? C.onPrimary : SPECIAL_FG} />;
  if (weekend)
    return <MaterialCommunityIcons name="calendar-month-outline" size={10} color={light ? C.onPrimary : WEEKEND_FG} />;
  if (waxing) return <Ionicons name="leaf-outline" size={10} color={light ? '#9FE0AE' : LEAF_FG} />;
  return <MaterialCommunityIcons name="moon-waning-crescent" size={10} color={light ? C.onPrimary : MOON_FG} />;
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
  const { typesFor, segmentState, segments } = useStore();
  const [picker, setPicker] = useState(false);
  const today = todayISO();

  // Leading/trailing days from the neighbouring months fill the first and last weeks.
  const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i) => new Date(ym.y, ym.m, i - lead + 1));

  return (
    <View>
      <View style={st.inner}>
        <View style={st.monthRow}>
          <NavButton icon="chevron-back" label="Previous month" onPress={() => onChangeYm(shiftMonth(ym, -1))} />
          <Touchable style={st.monthTitle} onPress={() => setPicker(true)} accessibilityLabel="Choose month">
            <Text style={st.monthText}>
              {MONTHS[ym.m]} {ym.y}
            </Text>
            <Ionicons name="chevron-down" size={15} color={C.primary} />
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
                          : C.surface;
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
                      tint === C.surface && st.cellPlain,
                      isToday && !isSel && st.cellToday,
                      isSel && st.cellSelected,
                    ]}>
                    {isSel ? (
                      <>
                        <BrandGradient id={`sel-${iso}`} from={C.gradientTo} to={C.primaryDark} />
                        <View style={st.selRing} pointerEvents="none" />
                      </>
                    ) : null}
                    <View style={st.mark} pointerEvents="none">
                      <DayMark special={special} weekend={weekend} waxing={types.includes('valarpirai')} light={isSel} />
                    </View>
                    {muhurtham ? (
                      <Ionicons name="star" size={12} color={isSel ? '#F2CF8A' : C.accent} style={st.star} />
                    ) : null}
                    <Text style={[st.num, isSel && { color: C.onPrimary }]}>{date.getDate()}</Text>
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
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={st.nav}>
      <Ionicons name={icon} size={18} color={C.primary} />
    </Touchable>
  );
}

function Legend() {
  const marks: { label: string; icon: ReactNode }[] = [
    { label: 'Muhurtham', icon: <Ionicons name="star" size={14} color={C.accent} /> },
    { label: 'Valarpirai', icon: <Ionicons name="leaf-outline" size={14} color={LEAF_FG} /> },
    { label: 'Theipirai', icon: <MaterialCommunityIcons name="moon-waning-crescent" size={14} color={MOON_FG} /> },
    { label: 'Special', icon: <MaterialCommunityIcons name="asterisk" size={14} color={SPECIAL_FG} /> },
    { label: 'Weekend', icon: <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} /> },
  ];
  const dots = [
    { label: 'Vacant', color: S.vacant },
    { label: 'Booked', color: S.booked },
    { label: 'Tentative', color: S.tentative },
    { label: 'Blocked', color: S.blocked },
    { label: 'Partly Booked', color: PARTLY_DOT },
  ];
  return (
    <View style={st.legend}>
      <View style={st.legendRow}>
        {marks.map((m) => (
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

const STATE_PILL: Record<SegState, { label: string; fg: string; bg: string }> = {
  free: { label: 'Vacant', fg: S.vacant, bg: S.vacantSoft },
  booked: { label: 'Booked', fg: S.booked, bg: S.bookedSoft },
  tentative: { label: 'Tentative', fg: S.tentativeText, bg: S.tentativeSoft },
  blocked: { label: 'Blocked', fg: S.blocked, bg: S.blockedSoft },
};

/** Grows the slot buttons to a 44pt touch target without changing their look. */
const BTN_SLOP = { top: 8, bottom: 8, left: 4, right: 4 };

/**
 * The selected-day card is laid out on a 1405px-wide reference; `u(px)` maps a reference pixel to dp
 * so the card keeps the design's proportions at any width.
 */
const DAY_REF_W = 1405;
const DATE_COL_W = 282;

/** Colors traced from the day-card design. */
const DAY = {
  ink: '#1A1414',
  muted: '#5A5563',
  rate: '#7A0A2C',
  gold: '#EFC56E',
  goldLine: '#E6B762',
  slotBorder: '#EFE5DA',
  iconBox: '#FCF2E3',
  icon: '#A96A22',
  vacantBg: '#E6F3E8',
  vacantFg: '#16592C',
  leaf: '#4A6A1E',
  chipFg: '#1E4F24',
};

/** Box top that puts a PT Serif line of size `fs` (line height 1.2·fs) on baseline `b`. */
const serifTop = (b: number, fs: number) => b - 0.9765 * fs;
/** Same for Inter. */
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
  const { typesFor, segmentState, segments, categoryFor, priceFor, bookingsOn } = useStore();
  const [cardWidth, setCardWidth] = useState(0);
  const d = parseISO(iso);
  const types = typesFor(iso);
  const phase = lunarPhase(types);
  const waxing = phase.key === 'valarpirai';
  const seg = segmentState(iso);
  const list = bookingsOn(iso);
  const u = (px: number) => (cardWidth / DAY_REF_W) * px;
  const serif = (b: number, fs: number, bold = true) => ({
    top: u(serifTop(b, fs)),
    fontFamily: bold ? F.pageSerifBold : F.pageSerif,
    fontSize: u(fs),
    lineHeight: u(fs * 1.2),
  });
  const tags = types.includes('muhurtham') || types.includes('special');
  const tag = { height: u(64), borderRadius: u(32), gap: u(10), paddingHorizontal: u(28) };
  const tagText = { fontSize: u(40), lineHeight: u(48) };

  return (
    <View style={[st.detail, { borderRadius: u(26) }]} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
      {cardWidth > 0 ? (
        <>
          {/* Date strip: day, month, weekday, moon phase, mandap line art */}
          <View style={[st.dateCol, { width: u(DATE_COL_W) }]}>
            <BrandGradient id="dateColGrad" from="#8A1535" to="#600A25" />
            <Image
              source={MANDAP_SCENE}
              contentFit="contain"
              pointerEvents="none"
              style={{ position: 'absolute', left: -u(38), bottom: 0, width: u(358), height: u(251), opacity: 0.92 }}
            />
            <Text style={[st.colText, serif(183, 164), { color: C.onPrimary, fontVariant: ['lining-nums'] }]}>{d.getDate()}</Text>
            <Text style={[st.colText, serif(251, 50), { color: DAY.gold, fontVariant: ['lining-nums'] }]}>
              {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
            </Text>
            <Text style={[st.colText, serif(313, 50), { color: C.onPrimary }]}>{WEEKDAY_LONG[d.getDay()]}</Text>
            <View
              style={{
                position: 'absolute',
                top: u(362),
                left: u((DATE_COL_W - 97) / 2),
                width: u(97),
                height: Math.max(u(4), 1),
                backgroundColor: DAY.goldLine,
              }}
            />
            <View style={[st.colIcon, { top: u(404), height: u(80) }]}>
              {waxing ? (
                <Ionicons name="leaf-outline" size={u(72)} color={DAY.gold} />
              ) : (
                <MaterialCommunityIcons name="moon-waning-crescent" size={u(72)} color={DAY.gold} />
              )}
            </View>
            <Text style={[st.colText, serif(521, 47), { color: C.onPrimary }]}>{phase.label}</Text>
          </View>

          <View style={{ flex: 1, paddingLeft: u(31), paddingRight: u(34), paddingBottom: u(40) }}>
            {/* Title, phase chip, booking count and rate */}
            <View style={{ height: u(218) }}>
              <Text
                numberOfLines={1}
                style={[st.abs, serif(103, 71), { left: u(11), right: u(330), color: DAY.ink, fontVariant: ['lining-nums'] }]}>
                {fmtFull(iso)}
              </Text>
              <View
                style={[
                  st.abs,
                  st.chip,
                  { top: u(35), right: u(3), width: u(290), height: u(73), borderRadius: u(37), gap: u(14) },
                  !waxing && { backgroundColor: D.theipirai.bg },
                ]}>
                {waxing ? (
                  <Ionicons name="leaf-outline" size={u(50)} color={DAY.leaf} />
                ) : (
                  <MaterialCommunityIcons name="moon-waning-crescent" size={u(50)} color={MOON_FG} />
                )}
                <Text style={{ fontFamily: F.pageSerif, fontSize: u(43), lineHeight: u(52), color: waxing ? DAY.chipFg : D.theipirai.fg }}>
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
              <View style={[st.abs, st.rateRow, { top: u(serifTop(180, 67)), right: u(8), gap: u(38) }]}>
                <Text numberOfLines={1} style={{ fontFamily: F.pageSerif, fontSize: u(43), lineHeight: u(52), color: DAY.muted }}>
                  {CATEGORY_LABEL[categoryFor(iso)]} rate
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: F.pageSerifBold, fontSize: u(67), lineHeight: u(80), color: DAY.rate, fontVariant: ['lining-nums'] }}>
                  {/* PT Serif has no rupee glyph; Inter supplies it. */}
                  <Text style={{ fontFamily: F.bold, fontSize: u(60) }}>₹</Text>
                  {inr(priceFor(iso, 'full')).replace('₹', '')}
                </Text>
              </View>
            </View>

            {tags ? (
              <View style={[st.tagRow, { gap: u(18), marginTop: -u(8), marginBottom: u(20), paddingLeft: u(11) }]}>
                {types.includes('muhurtham') ? (
                  <View style={[st.chip, tag, { backgroundColor: D.muhurtham.bg }]}>
                    <Ionicons name="star" size={u(40)} color={C.accent} />
                    <Text style={[st.tagText, tagText, { color: D.muhurtham.fg }]}>Muhurtham</Text>
                  </View>
                ) : null}
                {types.includes('special') ? (
                  <View style={[st.chip, tag, { backgroundColor: TINT.special }]}>
                    <MaterialCommunityIcons name="asterisk" size={u(40)} color={SPECIAL_FG} />
                    <Text style={[st.tagText, tagText, { color: SPECIAL_FG }]}>Special</Text>
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
                const btnText = { fontSize: u(50), lineHeight: u(60) };
                const action =
                  state === 'free' ? (
                    <Touchable
                      onPress={() => onBook(slot)}
                      disabled={!bookable}
                      accessibilityRole="button"
                      accessibilityLabel={`Book ${s.label}`}
                      hitSlop={BTN_SLOP}
                      style={[st.actBtn, btn]}>
                      <BrandGradient id={`bookGrad-${s.key}`} from="#9B2344" to="#7A1130" />
                      <Ionicons name="add" size={u(66)} color={C.onPrimary} />
                      <Text style={[st.actText, btnText]}>Book</Text>
                    </Touchable>
                  ) : booking ? (
                    <Touchable
                      onPress={() => onOpenBooking(booking)}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${s.label} booking`}
                      hitSlop={BTN_SLOP}
                      style={[st.actBtn, btn, st.viewBtn, { gap: u(14) }]}>
                      <Text style={[st.actText, btnText, { color: C.primary }]}>View</Text>
                      <Ionicons name="chevron-forward" size={u(48)} color={C.primary} />
                    </Touchable>
                  ) : (
                    <View style={btn} />
                  );
                return (
                  <View key={s.key} style={[st.slot, { height: u(175), borderRadius: u(28), paddingLeft: u(18), paddingRight: u(20) }]}>
                    <View style={[st.slotIcon, { width: u(112), height: u(120), borderRadius: u(24) }]}>
                      {icon.lib === 'mci' ? (
                        <MaterialCommunityIcons name={icon.name} size={u(80)} color={DAY.icon} />
                      ) : (
                        <Ionicons name={icon.name} size={u(72)} color={DAY.icon} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, marginLeft: u(26) }}>
                      <Text numberOfLines={1} style={{ fontFamily: F.pageSerifBold, fontSize: u(50), lineHeight: u(60), color: DAY.ink }}>
                        {s.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: F.regular,
                          fontSize: u(38.5),
                          lineHeight: u(48),
                          letterSpacing: u(1),
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
                          fontFamily: F.pageSerif,
                          fontSize: u(state === 'free' ? 44 : 36),
                          lineHeight: u(52),
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

const st = StyleSheet.create({
  inner: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1E9E2',
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
    ...elevation,
    shadowOpacity: 0.04,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },
  nav: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#EFE7E0',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation,
  },
  monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  monthText: { fontFamily: F.serifBold, fontSize: 23, lineHeight: 28, color: C.text, fontVariant: ['lining-nums'] },
  row: { flexDirection: 'row', gap: 5 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
    paddingBottom: 7,
  },
  /** Wider than tall, like the printed wall calendars halls keep at the desk. */
  cell: {
    flex: 1,
    height: 43,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  cellPlain: {
    borderWidth: 1,
    borderColor: '#EEE5DE',
    shadowColor: '#57152C',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cellOutside: { backgroundColor: TINT.outside },
  cellToday: { borderWidth: 1.5, borderColor: C.primary },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: C.primaryDark,
    shadowColor: '#57152C',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  selRing: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  mark: { position: 'absolute', top: 8, left: 4 },
  num: { fontFamily: F.semibold, fontSize: 12.5, lineHeight: 15, color: C.text, paddingLeft: 3 },
  numOutside: { fontFamily: F.regular, fontSize: 12.5, color: '#CFC6BF' },
  star: { position: 'absolute', top: 5, right: 4 },
  dots: { flexDirection: 'row', gap: 3.5 },
  dot: { width: 5.5, height: 5.5, borderRadius: 3 },

  legend: { marginTop: 12, backgroundColor: '#F8F4EF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6, columnGap: 4 },
  legendRule: { height: 1, backgroundColor: '#ECE3DA', marginVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontFamily: F.regular, fontSize: 10, color: C.text },
  legendDot: { width: 10, height: 10, borderRadius: 5 },

  detail: {
    flexDirection: 'row',
    minHeight: 200,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#F1D9C2',
    overflow: 'hidden',
    boxShadow: '0px 4px 14px rgba(87, 21, 44, 0.08)',
  },
  dateCol: { alignSelf: 'stretch', overflow: 'hidden', backgroundColor: '#700F2D' },
  rateRow: { flexDirection: 'row', alignItems: 'baseline' },
  colText: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  colIcon: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute' },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: DAY.vacantBg },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tagText: { fontFamily: F.pageSerif },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: DAY.slotBorder,
    boxShadow: '0px 1px 3px rgba(87, 21, 44, 0.04)',
  },
  slotIcon: { backgroundColor: DAY.iconBox, alignItems: 'center', justifyContent: 'center' },
  pill: { alignItems: 'center', justifyContent: 'center' },
  actBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0px 2px 5px rgba(87, 21, 44, 0.22)',
  },
  viewBtn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.primary, boxShadow: 'none' },
  actText: { fontFamily: F.pageSerif, color: C.onPrimary },
});
