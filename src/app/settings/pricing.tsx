import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BrandButton, GOLD, type MciName } from '@/components/brand-page';
import { TextField } from '@/components/form';
import { glassSurface, GlossTile, GradientFill, Sheen } from '@/components/glass';
import { GlassBackdrop, GlassPageHeader } from '@/components/glass-header';
import { BottomSheet, useToast } from '@/components/overlays';
import { PrimaryButton, ScrollFade, Touchable, useSmoothScroll } from '@/components/primitives';
import { inr, toNum } from '@/lib/format';
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  GST_RATE,
  rateTotal,
  SLOT_LABEL,
  SLOT_ORDER,
  slotTime,
  useStore,
  type Category,
  type Segment,
  type SegmentKey,
  type SlotKey,
} from '@/lib/store';
import { F, noOutline, radius, type Theme, type Tone } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/** 12-hour clock time as typed in the timing sheet, e.g. 6:00 or 06:00. */
const TIME_RE = /^(0?[1-9]|1[0-2]):[0-5]\d$/;

type Meridiem = 'AM' | 'PM';

/** Stored 24-hour "HH:MM" -> 12-hour text plus AM/PM for editing. */
function to12(hhmm: string): { time: string; ap: Meridiem } {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, ap: h >= 12 ? 'PM' : 'AM' };
}

/** 12-hour text plus AM/PM -> stored 24-hour "HH:MM". */
function to24(time: string, ap: Meridiem) {
  const [h, m] = time.split(':').map(Number);
  const h24 = (h % 12) + (ap === 'PM' ? 12 : 0);
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type Look = { icon: MciName | 'moon-outline'; fg: string; tile: Tone };

const moon = (t: Theme): Look => ({ icon: 'moon-outline', fg: t.tone.violet.fg, tile: t.tone.violet });

/** Line-art sky icon and tone per booking slot. */
const slotLook = (t: Theme): Record<SlotKey, Look> => ({
  full: { icon: 'white-balance-sunny', fg: t.tone.sand.fg, tile: t.tone.sand },
  first: { icon: 'weather-sunset-up', fg: t.tone.rose.fg, tile: t.tone.rose },
  second: moon(t),
  early: { icon: 'weather-sunset-up', fg: t.D.special.fg, tile: t.tone.blue },
});

const segmentLook = (t: Theme): Record<SegmentKey, Look> => ({
  early: { icon: 'weather-sunset-up', fg: t.tone.sand.fg, tile: t.tone.sand },
  late: { icon: 'white-balance-sunny', fg: t.tone.sand.fg, tile: t.tone.sand },
  evening: moon(t),
});

const catDot = (t: Theme): Record<Category, string> => ({
  muhurthamWeekend: t.C.accent,
  muhurtham: t.tone.rose.fg,
  special: t.D.special.fg,
  valarpirai: t.D.valarpirai.fg,
  weekend: t.textMuted,
  weekday: t.C.success,
});

const CAT_ICON: Record<Category, MciName> = {
  muhurthamWeekend: 'star-four-points',
  muhurtham: 'star-four-points',
  special: 'star-circle-outline',
  valarpirai: 'moon-waxing-crescent',
  weekend: 'calendar-weekend-outline',
  weekday: 'calendar-today',
};

const SHEET_FLORAL = require('../../../assets/images/customer/floral-top.png');
const TOTAL_FLORAL = require('../../../assets/images/customer/floral-bottom.png');

/** Digits only, shown with Indian grouping (1,75,000). */
const groupINR = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? inr(Number(digits)).slice(1) : '';
};

export default function PricingScreen() {
  const t = useTheme();
  const st = useSt();
  const SLOT_LOOK = slotLook(t);
  const SEGMENT_LOOK = segmentLook(t);
  const CAT_DOT = catDot(t);
  const { segments, rates, updateSegment, updateRate } = useStore();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [slot, setSlot] = useState<SlotKey>('full');
  const [editSeg, setEditSeg] = useState<Segment | null>(null);
  const [editRate, setEditRate] = useState<Category | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startAp, setStartAp] = useState<Meridiem>('AM');
  const [endAp, setEndAp] = useState<Meridiem>('AM');
  const [nonGst, setNonGst] = useState('');
  const [gst, setGst] = useState('');
  const rateSplit = { nonGst: toNum(nonGst), gst: toNum(gst) };
  const rateSum = rateTotal(rateSplit);

  const saveRate = () => {
    if (!editRate || rateSum <= 0) return;
    updateRate(slot, editRate, rateSplit);
    setEditRate(null);
    toast('Rate updated');
  };

  const segFormatOk = TIME_RE.test(start) && TIME_RE.test(end);
  /** Segments stay within one day, so the end must come after the start. */
  const segOrderOk = !segFormatOk || to24(end, endAp) > to24(start, startAp);
  const segValid = segFormatOk && segOrderOk;
  const { scrollRef, rootRef, scrolled, onScroll } = useSmoothScroll<ScrollView>();

  return (
    <View ref={rootRef} style={st.screen}>
      <GlassBackdrop />
      <GlassPageHeader lead="Timings &" accent="Rates" />

      <ScrollFade faded={scrolled}>
      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={[st.body, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        {/* Booking timings */}
        <Section
          icon={<Ionicons name="time-outline" size={21} color={t.G.blue} />}
          tile={t.tone.blue}
          title="Booking Timings"
          sub="Standard booking slots for the hall.">
          <View style={{ gap: 6 }}>
            {SLOT_ORDER.map((k) => (
              <Touchable
                key={k}
                accessibilityRole="button"
                accessibilityLabel={`Show ${SLOT_LABEL[k]} rates`}
                onPress={() => setSlot(k)}
                style={[st.row, glassSurface(t, t.frost(0.55), 12)]}>
                <Sheen radius={12} strength={0.45} height="45%" />
                <Bubble {...SLOT_LOOK[k]} />
                <Text style={st.rowLabel}>{SLOT_LABEL[k]}</Text>
                <Text style={st.rowTime}>{slotTime(k, segments)}</Text>
                <Ionicons name="chevron-forward" size={16} color={t.G.navy} />
              </Touchable>
            ))}
          </View>
        </Section>

        {/* Time segments */}
        <Section
          icon={<Ionicons name="settings-outline" size={20} color={t.tone.violet.fg} />}
          tile={t.tone.violet}
          title="Time Segments"
          sub="Booking timings are built from these three segments. Tap one to change its hours.">
          <View style={{ gap: 6 }}>
            {segments.map((sg) => (
              <Touchable
                key={sg.key}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${sg.label}`}
                style={[st.row, glassSurface(t, t.frost(0.55), 12)]}
                onPress={() => {
                  const a = to12(sg.start);
                  const b = to12(sg.end);
                  setStart(a.time);
                  setStartAp(a.ap);
                  setEnd(b.time);
                  setEndAp(b.ap);
                  setEditSeg(sg);
                }}>
                <Sheen radius={12} strength={0.45} height="45%" />
                <Bubble {...SEGMENT_LOOK[sg.key]} />
                <Text style={st.rowLabel}>{sg.label}</Text>
                <Text style={st.segTime}>
                  {sg.start} – {sg.end}
                </Text>
                <View style={[st.edit, glassSurface(t, t.frost(0.8), 8)]}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={t.G.blue} />
                </View>
              </Touchable>
            ))}
          </View>
        </Section>

        {/* Rates */}
        <Section
          icon={<MaterialCommunityIcons name="currency-inr" size={21} color={t.tone.mint.fg} />}
          tile={t.tone.mint}
          title={`Rates (${SLOT_LABEL[slot]})`}
          sub={`Rates based on date type for ${SLOT_LABEL[slot]} booking.`}>
          <View style={[st.tabs, glassSurface(t, t.frost(0.5), 16)]}>
            {SLOT_ORDER.map((k, i) => {
              const on = slot === k;
              const prevOn = i > 0 && slot === SLOT_ORDER[i - 1];
              return (
                <View key={k} style={{ flex: 1, flexDirection: 'row' }}>
                  {i > 0 && !on && !prevOn ? <View style={st.tabSep} /> : null}
                  <Touchable
                    onPress={() => setSlot(k)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    style={[st.tab, on && st.tabOn]}>
                    {on ? <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={13} horizontal /> : null}
                    {on ? <Sheen radius={13} strength={0.4} height="50%" /> : null}
                    <Text style={[st.tabText, on && st.tabTextOn]} numberOfLines={1}>
                      {k === 'early' ? 'Early' : SLOT_LABEL[k]}
                    </Text>
                  </Touchable>
                </View>
              );
            })}
          </View>
          <View style={[st.rates, glassSurface(t, t.frost(0.55), 12)]}>
            <Sheen radius={12} strength={0.35} height="20%" />
            {CATEGORY_ORDER.map((cat, i) => (
              <Touchable
                key={cat}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${CATEGORY_LABEL[cat]} rate`}
                style={[st.rateRow, i > 0 && st.rowRule]}
                onPress={() => {
                  setNonGst(String(rates[slot][cat].nonGst));
                  setGst(rates[slot][cat].gst ? String(rates[slot][cat].gst) : '');
                  setEditRate(cat);
                }}>
                <View style={[st.dot, { backgroundColor: CAT_DOT[cat], boxShadow: t.dark ? undefined : `0px 0px 4px ${CAT_DOT[cat]}40` }]} />
                <Text style={st.rateLabel}>{CATEGORY_LABEL[cat]}</Text>
                <Text style={st.rateAmt}>{inr(rateTotal(rates[slot][cat]))}</Text>
                <Ionicons name="chevron-forward" size={16} color={t.G.navy} />
              </Touchable>
            ))}
          </View>
        </Section>
      </ScrollView>
      </ScrollFade>

      <BottomSheet
        visible={!!editSeg}
        onClose={() => setEditSeg(null)}
        title={editSeg?.label}
        subtitle="Enter the time and choose AM or PM"
        footer={
          <PrimaryButton
            title="Save"
            disabled={!segValid}
            onPress={() => {
              if (editSeg) updateSegment(editSeg.key, to24(start, startAp), to24(end, endAp));
              setEditSeg(null);
              toast('Timing updated');
            }}
          />
        }>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <TextField
              label="Start"
              value={start}
              onChangeText={setStart}
              placeholder="06:00"
              keyboardType="numbers-and-punctuation"
              error={start && !TIME_RE.test(start) ? 'HH:MM, 01–12' : undefined}
            />
            <MeridiemToggle value={startAp} onChange={setStartAp} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <TextField
              label="End"
              value={end}
              onChangeText={setEnd}
              placeholder="11:00"
              keyboardType="numbers-and-punctuation"
              error={end && !TIME_RE.test(end) ? 'HH:MM, 01–12' : !segOrderOk ? 'Must be after start' : undefined}
            />
            <MeridiemToggle value={endAp} onChange={setEndAp} />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={!!editRate}
        onClose={() => setEditRate(null)}
        footer={
          <BrandButton title="Save Rate" icon="content-save-outline" disabled={rateSum <= 0} onPress={saveRate} style={st.save} />
        }>
        <Image source={SHEET_FLORAL} style={st.sheetFloral} contentFit="contain" pointerEvents="none" />
        {editRate ? (
          <View style={st.sheetHead}>
            <View style={[st.sheetIcon, { backgroundColor: `${CAT_DOT[editRate]}24` }]}>
              <MaterialCommunityIcons name={CAT_ICON[editRate]} size={20} color={CAT_DOT[editRate]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.sheetTitle}>{CATEGORY_LABEL[editRate]}</Text>
              <Text style={st.sheetSub}>{SLOT_LABEL[slot]}</Text>
            </View>
          </View>
        ) : null}

        <AmountCard icon="cash-multiple" label="Non-GST amount" value={nonGst} onChange={setNonGst} autoFocus />
        <AmountCard
          icon="file-percent-outline"
          label={`GST amount (${GST_RATE * 100}% tax applies)`}
          value={gst}
          onChange={setGst}
          onSubmit={saveRate}
        />

        <View style={st.totalCard}>
          <Image source={TOTAL_FLORAL} style={st.totalFloral} contentFit="contain" pointerEvents="none" />
          <View style={st.totalIcon}>
            <MaterialCommunityIcons name="calculator-variant-outline" size={18} color={t.C.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={st.totalTop}>
              <Text style={st.totalLabel}>Total price</Text>
              <Text style={st.totalAmt} numberOfLines={1} adjustsFontSizeToFit>
                {inr(rateSum)}
              </Text>
            </View>
            <Text style={st.totalHint}>Non-GST + GST + {GST_RATE * 100}% tax on the GST amount</Text>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

/** Frosted section card: pastel icon tile, navy title with a blue rule, caption, then content. */
function Section({
  icon,
  tile,
  title,
  sub,
  children,
}: {
  icon: ReactNode;
  tile: Tone;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  const t = useTheme();
  const st = useSt();
  return (
    <View style={[st.card, glassSurface(t, t.tint(0.5), 18)]}>
      <Sheen radius={18} strength={0.45} height="25%" />
      <View style={st.head}>
        <GlossTile from={tile.from} to={tile.to} radius={10} style={st.headIcon}>
          {icon}
        </GlossTile>
        <View style={{ flex: 1 }}>
          <View style={st.titleRow}>
            <Text style={st.title}>{title}</Text>
            <TitleRule />
          </View>
          <Text style={st.sub}>{sub}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

/** Blue hairline after a section title, ending in a small open diamond. */
function TitleRule() {
  const t = useTheme();
  return (
    <Svg width={60} height={8} viewBox="0 0 60 8" pointerEvents="none">
      <Path d="M0 4H52" stroke={t.G.blue} strokeWidth={1} strokeOpacity={0.85} />
      <Path d="M55.5 1L58.5 4L55.5 7L52.5 4Z" stroke={t.G.blue} strokeWidth={1} fill={t.dark ? t.surface : t.highlight} />
    </Svg>
  );
}

/** White card with an icon + label over a ₹ amount input. */
function AmountCard({
  icon,
  label,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: {
  icon: MciName;
  label: string;
  value: string;
  onChange: (digits: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  const t = useTheme();
  const st = useSt();
  const [focus, setFocus] = useState(false);
  return (
    <View style={st.amountCard}>
      <View style={st.amountHead}>
        <View style={st.amountIcon}>
          <MaterialCommunityIcons name={icon} size={16} color={t.C.primary} />
        </View>
        <Text style={st.amountLabel}>{label}</Text>
      </View>
      <View style={[st.amountField, focus && { borderColor: t.C.primary }]}>
        <View style={st.rupee}>
          <Text style={st.rupeeText}>₹</Text>
        </View>
        <TextInput
          value={groupINR(value)}
          onChangeText={(v) => onChange(v.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9))}
          placeholder="0"
          placeholderTextColor={t.C.textMuted}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          returnKeyType={onSubmit ? 'done' : 'next'}
          onSubmitEditing={onSubmit}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          accessibilityLabel={label}
          style={st.amountInput}
        />
      </View>
    </View>
  );
}

/** Glossy pastel circle holding a line-art sky icon. */
function Bubble({ icon, fg, tile }: Look) {
  const st = useSt();
  return (
    <GlossTile from={tile.from} to={tile.to} radius={16} style={st.bubble}>
      {icon === 'moon-outline' ? (
        <Ionicons name="moon-outline" size={18} color={fg} />
      ) : (
        <MaterialCommunityIcons name={icon} size={19} color={fg} />
      )}
    </GlossTile>
  );
}

/** AM / PM segmented switch under a time field. */
function MeridiemToggle({ value, onChange }: { value: Meridiem; onChange: (v: Meridiem) => void }) {
  const t = useTheme();
  const st = useSt();
  return (
    <View style={st.meridiem}>
      {(['AM', 'PM'] as const).map((ap) => {
        const on = value === ap;
        return (
          <Touchable
            key={ap}
            onPress={() => onChange(ap)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[st.meridiemItem, on && st.meridiemOn]}>
            <Text style={[st.meridiemText, on && { color: t.C.onPrimary, fontFamily: F.semibold }]}>{ap}</Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    meridiem: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.C.border,
      backgroundColor: t.surface,
    },
    meridiemItem: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    meridiemOn: { backgroundColor: t.C.primary },
    meridiemText: { fontFamily: F.medium, fontSize: 13.5, color: t.C.text },
    screen: { flex: 1, backgroundColor: t.background },
    body: { paddingHorizontal: 18, paddingTop: 16, gap: 12 },

    card: { padding: 11, paddingTop: 13, gap: 11 },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingHorizontal: 2 },
    headIcon: { width: 38, height: 38 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    title: { fontFamily: F.semibold, fontSize: 17.5, lineHeight: 22, letterSpacing: -0.2, color: t.G.ink },
    sub: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: t.G.muted, marginTop: 1 },

    row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, paddingLeft: 6, paddingRight: 10 },
    rowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.G.rule },
    bubble: { width: 36, height: 36 },
    rowLabel: { flex: 1, fontFamily: F.semibold, fontSize: 14, color: t.G.ink },
    rowTime: { fontFamily: F.regular, fontSize: 12.5, color: t.G.muted },
    segTime: { fontFamily: F.medium, fontSize: 13.5, color: t.G.ink, fontVariant: ['tabular-nums'] },
    edit: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: -4 },

    tabs: { flexDirection: 'row', padding: 2, height: 38 },
    tab: { flex: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    tabOn: {
      borderWidth: 1,
      borderColor: t.G.buttonBorder,
      boxShadow: t.G.buttonGlow,
    },
    tabSep: { width: StyleSheet.hairlineWidth, marginVertical: 8, backgroundColor: t.G.rule },
    tabText: { fontFamily: F.medium, fontSize: 12.5, color: t.G.ink },
    tabTextOn: { fontFamily: F.semibold, color: t.G.onBlue },

    rates: { paddingHorizontal: 12 },
    rateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 42 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    rateLabel: { flex: 1, fontFamily: F.regular, fontSize: 13.5, color: t.G.ink },
    rateAmt: { fontFamily: F.semibold, fontSize: 14, color: t.G.ink, fontVariant: ['tabular-nums'] },

    sheetFloral: { position: 'absolute', top: -12, right: -20, width: 130, height: 100, opacity: 0.35 },
    sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 },
    sheetIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    sheetTitle: { fontFamily: F.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3, color: t.C.primary },
    sheetSub: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 17, color: t.C.textSecondary },

    amountCard: { backgroundColor: t.surface, borderRadius: radius.md, padding: 10, gap: 8, ...t.elevation },
    amountHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    amountIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: t.C.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    amountLabel: { flex: 1, fontFamily: F.medium, fontSize: 12.5, color: t.C.text },
    amountField: {
      flexDirection: 'row',
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.C.borderStrong,
      overflow: 'hidden',
    },
    rupee: { width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: t.C.surfaceAlt },
    rupeeText: { fontFamily: F.medium, fontSize: 14, color: t.C.textSecondary },
    amountInput: {
      flex: 1,
      paddingHorizontal: 12,
      fontFamily: F.regular,
      fontSize: 14,
      color: t.C.text,
      fontVariant: ['tabular-nums'],
      ...noOutline,
    },

    totalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 11,
      borderRadius: radius.md,
      borderWidth: 1.2,
      borderColor: t.dark ? 'rgba(201, 164, 94, 0.3)' : '#E9CFA6',
      backgroundColor: t.C.accentSoft,
      overflow: 'hidden',
    },
    totalFloral: { position: 'absolute', left: -10, bottom: -18, width: 86, height: 70, opacity: 0.4 },
    totalIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    totalLabel: { flex: 1, fontFamily: F.semibold, fontSize: 15, color: t.C.primary },
    totalAmt: { flexShrink: 1, fontFamily: F.semibold, fontSize: 20, letterSpacing: -0.3, color: t.C.success, fontVariant: ['lining-nums'] },
    totalHint: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 15, color: t.C.textSecondary },
    save: { height: 46, borderWidth: 1.4, borderColor: GOLD },
  }),
);
