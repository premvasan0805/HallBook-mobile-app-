import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton, Touchable } from '@/components/primitives';
import { BottomSheet } from '@/components/overlays';
import { MONTHS, parseISO, toISO, todayISO } from '@/lib/format';
import { useStore, type DateType } from '@/lib/store';
import { glassSurface, GradientFill, Sheen } from '@/components/glass';
import { F, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

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

/** Availability dots (overview and date sheet). */
const dotTone = (t: Theme): Record<Exclude<DayAvailability, 'free'>, string> => ({
  booked: t.S.booked,
  partial: t.S.partial,
  tentative: t.S.tentative,
  blocked: t.S.blocked,
});

const kindBg = (t: Theme): Record<DateType, string> => ({
  muhurtham: t.D.muhurtham.bg,
  valarpirai: t.D.valarpirai.bg,
  special: t.D.special.bg,
  holiday: t.D.holiday.bg,
});

/** Date-sheet tile tints: a little richer than the overview so they read on frosted glass. */
const kindBoxed = (t: Theme): Record<DateType, { bg: string; fg?: string }> =>
  t.dark
    ? {
        muhurtham: { bg: 'rgba(201, 164, 94, 0.2)', fg: t.D.muhurtham.fg },
        valarpirai: { bg: 'rgba(183, 162, 224, 0.18)' },
        special: { bg: 'rgba(124, 196, 206, 0.18)' },
        holiday: { bg: 'rgba(227, 148, 166, 0.18)' },
      }
    : {
        muhurtham: { bg: '#F9F0DA', fg: '#9A6A1E' },
        valarpirai: { bg: '#ECE8F8' },
        special: { bg: '#DCF0EA' },
        holiday: { bg: '#F9E6EC' },
      };

/** Legend dots for the date-sheet tile tints (a shade stronger than the tiles so they read at 9px). */
const kindLegend = (t: Theme) =>
  t.dark
    ? { muhurtham: 'rgba(201, 164, 94, 0.55)', valarpirai: 'rgba(183, 162, 224, 0.5)', special: 'rgba(124, 196, 206, 0.5)' }
    : { muhurtham: '#F1E2C2', valarpirai: '#DDD8F2', special: '#C4E6DC' };

/** Legend column widths in the date sheet; the first holds "Partly booked". */
const LEGEND_COLS = ['31%', '26%', '21%', '22%'] as const;

export function MonthHeader({ ym, onChange, boxed }: { ym: YM; onChange: (v: YM) => void; boxed?: boolean }) {
  const t = useTheme();
  const st = useSt();
  const G = t.G;
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
  const t = useTheme();
  const st = useSt();
  const { typesFor } = useStore();
  const availability = useDayAvailability();
  const today = todayISO();
  const DOT = dotTone(t);
  const KIND_BG = kindBg(t);
  const KIND_BOXED = kindBoxed(t);

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
                    {isSel ? <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={10} /> : null}
                    {isSel ? <Sheen radius={10} strength={0.35} height="50%" /> : null}
                    <Text
                      style={[
                        st.tileText,
                        muhurtham && { color: KIND_BOXED.muhurtham.fg },
                        avail === 'blocked' && st.strike,
                        (isToday || isSel) && { fontFamily: F.semibold },
                        isToday && !isSel && { color: t.G.navy },
                        isSel && { color: t.G.onBlue },
                      ]}>
                      {parseISO(iso).getDate()}
                    </Text>
                    <View style={[st.tileDot, avail !== 'free' && { backgroundColor: isSel ? t.G.onBlue : DOT[avail] }]} />
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
                      kind === 'muhurtham' && showIndicators && { color: t.D.muhurtham.fg, fontFamily: F.semibold },
                      avail === 'blocked' && st.strike,
                      isSel && { color: t.G.onBlue, fontFamily: F.semibold },
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
  const t = useTheme();
  const st = useSt();
  const DOT = dotTone(t);
  if (boxed) {
    // Date sheet: every key is a round dot, laid out in four columns.
    const kl = kindLegend(t);
    const keys = [
      { c: kl.muhurtham, l: 'Muhurtham' },
      { c: kl.valarpirai, l: 'Valarpirai' },
      { c: kl.special, l: 'Special' },
      { c: DOT.booked, l: 'Booked' },
      { c: DOT.partial, l: 'Partly booked' },
      { c: DOT.tentative, l: 'Tentative' },
      { c: DOT.blocked, l: 'Blocked' },
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
    { c: t.D.muhurtham.bg, l: 'Muhurtham', square: true },
    { c: t.D.valarpirai.bg, l: 'Valarpirai', square: true },
    { c: t.D.special.bg, l: 'Special', square: true },
    { c: t.S.booked, l: 'Booked' },
    { c: t.S.partial, l: 'Partly booked' },
    { c: t.S.tentative, l: 'Tentative' },
    { c: t.S.blocked, l: 'Blocked' },
  ];
  return (
    <View style={boxed ? st.legendBoxed : st.legend}>
      {tints.map((k) => (
        <View key={k.l} style={[st.legendItem, boxed && st.legendItemBoxed]}>
          <View
            style={
              k.square
                ? { width: 12, height: 12, borderRadius: 4, backgroundColor: k.c, borderWidth: 1, borderColor: t.glassBorder }
                : { width: 7, height: 7, borderRadius: 4, backgroundColor: k.c }
            }
          />
          <Text style={st.legendText}>{k.l}</Text>
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
  const t = useTheme();
  const st = useSt();
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
              <Text style={[st.monthCellText, on && { color: t.G.onBlue, fontFamily: F.semibold }]}>{name.slice(0, 3)}</Text>
            </Touchable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const useSt = makeStyles((t) => {
  const G = t.G;
  /** Soft ring + drop under the selected day/month (no neon glow). */
  const SELECTED_GLOW = G.buttonGlow;
  return StyleSheet.create({
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 8 },
    monthPlain: { fontFamily: F.semibold, fontSize: 16, lineHeight: 20, letterSpacing: -0.2, color: G.ink },
    row: { flexDirection: 'row' },
    weekday: {
      flex: 1,
      textAlign: 'center',
      fontFamily: F.medium,
      fontSize: 11,
      letterSpacing: 0.3,
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
    daySelected: { backgroundColor: G.blue, borderWidth: 1.5, borderColor: G.buttonBorder, boxShadow: SELECTED_GLOW },
    dayText: { fontFamily: F.medium, fontSize: 13.5, color: G.ink },
    strike: { textDecorationLine: 'line-through', color: t.C.textMuted },
    dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 8, marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendBoxed: {
      ...glassSurface(t, t.frost(0.6), 12),
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 10,
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    legendItemBoxed: { gap: 7 },
    legendTextBoxed: { fontFamily: F.medium, fontSize: 11, color: G.navy },
    legendText: { fontFamily: F.regular, fontSize: 10.5, color: G.muted },
  
    navBoxed: {
      ...glassSurface(t, t.frost(0.72), 16),
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthBoxed: { fontFamily: F.semibold, fontSize: 18, lineHeight: 23, letterSpacing: -0.3, color: G.ink },
    cellBoxed: { flex: 1, paddingHorizontal: 3.5, paddingVertical: 3.5 },
    tile: {
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.08)' : t.glassBorder,
      backgroundColor: t.frost(0.66),
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 3,
      boxShadow: t.dark
        ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.05)'
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.85), 0px 2px 5px rgba(30, 30, 30, 0.05)',
    },
    tileToday: { borderWidth: 2, borderColor: G.navy, backgroundColor: t.frost(0.85) },
    tileSelected: { borderWidth: 1.5, borderColor: G.buttonBorder, boxShadow: SELECTED_GLOW },
    tileText: { fontFamily: F.medium, fontSize: 13, lineHeight: 17, color: G.ink },
    tileDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
    pickerYear: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    monthCell: {
      ...glassSurface(t, t.frost(0.62), 12),
      width: '30%',
      flexGrow: 1,
      minHeight: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthCellOn: { backgroundColor: G.blue, boxShadow: SELECTED_GLOW },
    monthCellText: { fontFamily: F.medium, fontSize: 13, color: G.ink },
  });
});
