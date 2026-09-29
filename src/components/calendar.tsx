import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton, Touchable } from '@/components/primitives';
import { BottomSheet } from '@/components/overlays';
import { MONTHS, parseISO, toISO, todayISO } from '@/lib/format';
import { useStore, type DateType } from '@/lib/store';
import { glassSurface, GradientFill, Sheen } from '@/components/glass';
import { C, D, F, G, S } from '@/lib/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type YM = { y: number; m: number };

export function shiftMonth({ y, m }: YM, d: number): YM {
  const nm = m + d;
  return { y: y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
}

export function currentYM(): YM {
  const t = parseISO(todayISO());
  return { y: t.getFullYear(), m: t.getMonth() };
}

/** Availability of a day summarised for the calendar dot. */
export type DayAvailability = 'free' | 'partial' | 'booked' | 'tentative' | 'blocked';

export function useDayAvailability() {
  const { segmentState } = useStore();
  return (iso: string, excludeId?: string): DayAvailability => {
    const s = Object.values(segmentState(iso, excludeId));
    if (s.every((x) => x === 'blocked')) return 'blocked';
    if (s.every((x) => x === 'free')) return 'free';
    if (s.every((x) => x === 'booked')) return 'booked';
    if (s.some((x) => x === 'booked')) return 'partial';
    return 'tentative';
  };
}

const DOT: Record<Exclude<DayAvailability, 'free'>, string> = {
  booked: S.booked,
  partial: S.partial,
  tentative: S.tentative,
  blocked: S.blocked,
};

const KIND_BG: Record<DateType, string> = {
  muhurtham: D.muhurtham.bg,
  valarpirai: D.valarpirai.bg,
  special: D.special.bg,
  holiday: D.holiday.bg,
};

/** Date-sheet tile tints: a little richer than the overview so they read on frosted glass. */
const KIND_BOXED: Record<DateType, { bg: string; fg?: string }> = {
  muhurtham: { bg: '#FBEFD2', fg: '#B0700E' },
  valarpirai: { bg: '#EAE6FA' },
  special: { bg: '#D5F0E8' },
  holiday: { bg: '#FAE3EA' },
};

/** Legend column widths in the date sheet; the first holds "Partly booked". */
const LEGEND_COLS = ['31%', '26%', '21%', '22%'] as const;

/** Availability dots in the date sheet. */
const DOT_BOXED: Record<string, string> = {
  booked: '#E0143C',
  partial: '#F28DA0',
  tentative: '#F0A419',
  blocked: '#7B86A0',
};

export function MonthHeader({ ym, onChange, boxed }: { ym: YM; onChange: (v: YM) => void; boxed?: boolean }) {
  const [picker, setPicker] = useState(false);
  const nav = (dir: -1 | 1) =>
    boxed ? (
      <Touchable
        onPress={() => onChange(shiftMonth(ym, dir))}
        accessibilityLabel={dir < 0 ? 'Previous month' : 'Next month'}
        hitSlop={6}
        style={st.navBoxed}>
        <Ionicons name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={19} color={G.navy} />
      </Touchable>
    ) : (
      <IconButton
        icon={dir < 0 ? 'chevron-back' : 'chevron-forward'}
        size={40}
        onPress={() => onChange(shiftMonth(ym, dir))}
        accessibilityLabel={dir < 0 ? 'Previous month' : 'Next month'}
      />
    );
  return (
    <View style={st.monthRow}>
      {nav(-1)}
      <Touchable style={st.monthTitle} onPress={() => setPicker(true)} accessibilityLabel="Choose month">
        <Text style={boxed ? st.monthBoxed : st.monthPlain}>
          {MONTHS[ym.m]} {ym.y}
        </Text>
        <Ionicons name="chevron-down" size={boxed ? 17 : 14} color={boxed ? G.navy : G.blue} />
      </Touchable>
      {nav(1)}
      <MonthPicker
        key={String(picker)}
        visible={picker}
        value={ym}
        onClose={() => setPicker(false)}
        onPick={(v) => {
          onChange(v);
          setPicker(false);
        }}
      />
    </View>
  );
}

/**
 * Month grid. `overview` shows date-category tint + availability dots; `pick` is used in forms
 * and greys out dates the caller marks as disabled.
 */
export function CalendarGrid({
  ym,
  selected,
  onSelect,
  isDisabled,
  showIndicators = true,
  excludeId,
  boxed,
}: {
  ym: YM;
  selected?: string | null;
  onSelect: (iso: string) => void;
  isDisabled?: (iso: string) => boolean;
  showIndicators?: boolean;
  excludeId?: string;
  /** Bordered day tiles with the dot inside, as in the booking date sheet. */
  boxed?: boolean;
}) {
  const { typesFor } = useStore();
  const availability = useDayAvailability();
  const today = todayISO();

  const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => toISO(new Date(ym.y, ym.m, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <View>
      <View style={st.row}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={st.weekday}>
            {w}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={st.row}>
          {cells.slice(r * 7, r * 7 + 7).map((iso, i) => {
            if (!iso) return <View key={i} style={boxed ? st.cellBoxed : st.cell} />;
            const types = typesFor(iso);
            const kind: DateType | null = types.includes('muhurtham')
              ? 'muhurtham'
              : types.includes('special')
                ? 'special'
                : types.includes('valarpirai')
                  ? 'valarpirai'
                  : types.includes('holiday')
                    ? 'holiday'
                    : null;
            const avail = showIndicators ? availability(iso, excludeId) : 'free';
            const disabled = isDisabled?.(iso) ?? false;
            const isSel = selected === iso;
            const isToday = iso === today;
            if (boxed) {
              const muhurtham = kind === 'muhurtham' && showIndicators;
              // Unavailable days keep their normal look (as in the design) but can't be tapped.
              const Cell = disabled ? View : Touchable;
              return (
                <Cell
                  key={iso}
                  style={st.cellBoxed}
                  onPress={() => onSelect(iso)}
                  accessibilityLabel={iso}
                  accessibilityState={{ selected: isSel, disabled }}>
                  <View
                    style={[
                      st.tile,
                      kind && showIndicators && { backgroundColor: KIND_BOXED[kind].bg },
                      isToday && st.tileToday,
                      isSel && st.tileSelected,
                    ]}>
                    {isSel ? <GradientFill from={G.gradFrom} to={G.gradTo} radius={10} /> : null}
                    {isSel ? <Sheen radius={10} strength={0.35} height="50%" /> : null}
                    <Text
                      style={[
                        st.tileText,
                        muhurtham && { color: KIND_BOXED.muhurtham.fg },
                        avail === 'blocked' && st.strike,
                        (isToday || isSel) && { fontFamily: F.bold },
                        isToday && !isSel && { color: G.navy },
                        isSel && { color: C.onPrimary },
                      ]}>
                      {parseISO(iso).getDate()}
                    </Text>
                    <View style={[st.tileDot, avail !== 'free' && { backgroundColor: isSel ? C.onPrimary : DOT_BOXED[avail] }]} />
                  </View>
                </Cell>
              );
            }
            return (
              <Touchable
                key={iso}
                style={st.cell}
                disabled={disabled}
                onPress={() => onSelect(iso)}
                accessibilityLabel={iso}>
                <View
                  style={[
                    st.day,
                    kind && showIndicators && { backgroundColor: KIND_BG[kind] },
                    isToday && !isSel && st.today,
                    isSel && st.daySelected,
                  ]}>
                  <Text
                    style={[
                      st.dayText,
                      kind === 'muhurtham' && showIndicators && { color: D.muhurtham.fg, fontFamily: F.semibold },
                      avail === 'blocked' && st.strike,
                      isSel && { color: C.onPrimary, fontFamily: F.semibold },
                    ]}>
                    {parseISO(iso).getDate()}
                  </Text>
                </View>
                <View style={[st.dot, avail !== 'free' && { backgroundColor: DOT[avail] }]} />
              </Touchable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function CalendarLegend({ boxed }: { boxed?: boolean }) {
  if (boxed) {
    // Date sheet: every key is a round dot, laid out in four columns.
    const keys = [
      { c: '#F6E3BE', l: 'Muhurtham' },
      { c: '#DCD6F7', l: 'Valarpirai' },
      { c: '#BDE8DD', l: 'Special' },
      { c: DOT_BOXED.booked, l: 'Booked' },
      { c: DOT_BOXED.partial, l: 'Partly booked' },
      { c: DOT_BOXED.tentative, l: 'Tentative' },
      { c: DOT_BOXED.blocked, l: 'Blocked' },
    ];
    return (
      <View style={st.legendBoxed}>
        {keys.map((k, i) => (
          <View key={k.l} style={[st.legendItem, st.legendItemBoxed, { width: LEGEND_COLS[i % 4] }]}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: k.c }} />
            <Text style={[st.legendText, st.legendTextBoxed]} numberOfLines={1}>
              {k.l}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  const tints = [
    { c: D.muhurtham.bg, l: 'Muhurtham', square: true },
    { c: D.valarpirai.bg, l: 'Valarpirai', square: true },
    { c: D.special.bg, l: 'Special', square: true },
    { c: S.booked, l: 'Booked' },
    { c: S.partial, l: 'Partly booked' },
    { c: S.tentative, l: 'Tentative' },
    { c: S.blocked, l: 'Blocked' },
  ];
  return (
    <View style={boxed ? st.legendBoxed : st.legend}>
      {tints.map((t) => (
        <View key={t.l} style={[st.legendItem, boxed && st.legendItemBoxed]}>
          <View
            style={
              t.square
                ? { width: 12, height: 12, borderRadius: 4, backgroundColor: t.c, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' }
                : { width: 7, height: 7, borderRadius: 4, backgroundColor: t.c }
            }
          />
          <Text style={st.legendText}>{t.l}</Text>
        </View>
      ))}
    </View>
  );
}

export function MonthPicker({
  visible,
  value,
  onClose,
  onPick,
}: {
  visible: boolean;
  value: YM;
  onClose: () => void;
  onPick: (v: YM) => void;
}) {
  const [year, setYear] = useState(value.y);
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Choose month">
      <View style={st.pickerYear}>
        <IconButton icon="chevron-back" size={40} onPress={() => setYear((y) => y - 1)} />
        <Text style={st.monthBoxed}>{year}</Text>
        <IconButton icon="chevron-forward" size={40} onPress={() => setYear((y) => y + 1)} />
      </View>
      <View style={st.monthGrid}>
        {MONTHS.map((name, i) => {
          const on = year === value.y && i === value.m;
          return (
            <Touchable
              key={name}
              onPress={() => onPick({ y: year, m: i })}
              style={[st.monthCell, on && st.monthCellOn]}>
              <Text style={[st.monthCellText, on && { color: '#FFFFFF', fontFamily: F.semibold }]}>{name.slice(0, 3)}</Text>
            </Touchable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const SELECTED_GLOW =
  'inset 0px 1px 0px rgba(255, 255, 255, 0.45), 0px 0px 0px 1px rgba(95, 140, 220, 0.35), 0px 0px 10px rgba(70, 125, 230, 0.5), 0px 3px 8px rgba(28, 72, 176, 0.25)';

const st = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 8 },
  monthPlain: { fontFamily: F.pageSerifBold, fontSize: 17, lineHeight: 22, color: G.ink },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: F.medium,
    fontSize: 11,
    color: G.muted,
    paddingVertical: 7,
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3, minHeight: 46 },
  day: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderWidth: 1.5, borderColor: G.blue },
  daySelected: { backgroundColor: G.blue, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)', boxShadow: SELECTED_GLOW },
  dayText: { fontFamily: F.medium, fontSize: 13.5, color: G.ink },
  strike: { textDecorationLine: 'line-through', color: C.textMuted },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBoxed: {
    ...glassSurface('rgba(255, 255, 255, 0.6)', 12, 'rgba(31, 58, 112, 0.05)'),
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  legendItemBoxed: { gap: 7 },
  legendTextBoxed: { fontSize: 11.5, color: '#3A4258' },
  legendText: { fontFamily: F.regular, fontSize: 10.5, color: G.muted },

  navBoxed: {
    ...glassSurface('rgba(255, 255, 255, 0.72)', 16, 'rgba(31, 58, 112, 0.08)'),
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBoxed: { fontFamily: F.pageSerifBold, fontSize: 19.5, lineHeight: 25, letterSpacing: -0.3, color: G.ink },
  cellBoxed: { flex: 1, paddingHorizontal: 3.5, paddingVertical: 3.5 },
  tile: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.66)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 3,
    boxShadow: 'inset 0px 1px 0px rgba(255, 255, 255, 1), 0px 2px 5px rgba(31, 58, 112, 0.06)',
  },
  tileToday: { borderWidth: 2, borderColor: G.navy, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  tileSelected: { borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)', boxShadow: SELECTED_GLOW },
  tileText: { fontFamily: F.regular, fontSize: 13.5, lineHeight: 17, color: G.ink },
  tileDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  pickerYear: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthCell: {
    ...glassSurface('rgba(255, 255, 255, 0.62)', 12, 'rgba(31, 58, 112, 0.05)'),
    width: '30%',
    flexGrow: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellOn: { backgroundColor: G.blue, boxShadow: SELECTED_GLOW },
  monthCellText: { fontFamily: F.medium, fontSize: 13, color: G.ink },
});
