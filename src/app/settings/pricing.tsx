import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BrandButton,
  BrandFloral,
  BrandPageHeader,
  GOLD,
  GoldRule,
  SEGMENT_META,
  SLOT_META,
  type MciName,
} from '@/components/brand-page';
import { TextField } from '@/components/form';
import { BottomSheet, useToast } from '@/components/overlays';
import { PrimaryButton, Touchable } from '@/components/primitives';
import { fmtClock, inr, toNum } from '@/lib/format';
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
  type SlotKey,
} from '@/lib/store';
import { C, elevation, F, noOutline, radius, T } from '@/lib/theme';

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

const CAT_DOT: Record<Category, string> = {
  muhurthamWeekend: '#C8963E',
  muhurtham: '#E0405F',
  special: '#2A7682',
  valarpirai: '#6A3FB5',
  weekend: '#A3A3A3',
  weekday: '#2E7D32',
};

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
  const { segments, rates, updateSegment, updateRate } = useStore();
  const toast = useToast();
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

  const segValid = TIME_RE.test(start) && TIME_RE.test(end);

  return (
    <View style={st.screen}>
      <BrandFloral />
      <BrandPageHeader title="Timings &" accent="Rates" />

      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        {/* Booking timings */}
        <Section
          icon={<Ionicons name="time-outline" size={21} color={C.primary} />}
          title="Booking Timings"
          sub="Standard booking slots for the hall.">
          <View style={st.list}>
            {SLOT_ORDER.map((k, i) => {
              const m = SLOT_META[k];
              return (
                <View key={k} style={[st.row, i > 0 && st.rowRule]}>
                  <Bubble icon={m.icon} fg={m.fg} bg={m.bg} />
                  <Text style={st.rowLabel}>{SLOT_LABEL[k]}</Text>
                  <Text style={st.rowTime}>{slotTime(k, segments)}</Text>
                </View>
              );
            })}
          </View>
        </Section>

        {/* Time segments */}
        <Section
          icon={<Ionicons name="settings-outline" size={20} color={C.primary} />}
          title="Time Segments"
          sub="Booking timings are built from these three segments. Tap one to change its hours.">
          <View style={st.list}>
            {segments.map((sg, i) => {
              const m = SEGMENT_META[sg.key];
              return (
                <Touchable
                  key={sg.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${sg.label}`}
                  style={[st.row, i > 0 && st.rowRule]}
                  onPress={() => {
                    const a = to12(sg.start);
                    const b = to12(sg.end);
                    setStart(a.time);
                    setStartAp(a.ap);
                    setEnd(b.time);
                    setEndAp(b.ap);
                    setEditSeg(sg);
                  }}>
                  <Bubble icon={m.icon} fg={m.fg} bg={m.bg} />
                  <Text style={st.rowLabel}>{sg.label}</Text>
                  <Text style={st.segTime}>
                    {fmtClock(sg.start)} – {fmtClock(sg.end)}
                  </Text>
                  <MaterialCommunityIcons name="square-edit-outline" size={20} color={C.primary} />
                </Touchable>
              );
            })}
          </View>
        </Section>

        {/* Rates */}
        <Section
          icon={<MaterialCommunityIcons name="currency-inr" size={21} color={C.primary} />}
          title={`Rates (${SLOT_LABEL[slot]})`}
          sub={`Rates based on date type for ${SLOT_LABEL[slot]} booking.`}>
          <View style={st.tabs}>
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
                    <Text style={[st.tabText, on && st.tabTextOn]} numberOfLines={1}>
                      {k === 'early' ? 'Early' : SLOT_LABEL[k]}
                    </Text>
                  </Touchable>
                </View>
              );
            })}
          </View>
          <View style={st.list}>
            {CATEGORY_ORDER.map((cat, i) => (
              <Touchable
                key={cat}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${CATEGORY_LABEL[cat]} rate`}
                style={[st.row, st.rateRow, i > 0 && st.rowRule]}
                onPress={() => {
                  setNonGst(String(rates[slot][cat].nonGst));
                  setGst(rates[slot][cat].gst ? String(rates[slot][cat].gst) : '');
                  setEditRate(cat);
                }}>
                <View style={[st.dot, { backgroundColor: CAT_DOT[cat] }]} />
                <Text style={st.rateLabel}>{CATEGORY_LABEL[cat]}</Text>
                <Text style={st.rateAmt}>{inr(rateTotal(rates[slot][cat]))}</Text>
                <Ionicons name="chevron-forward" size={17} color={C.text} />
              </Touchable>
            ))}
          </View>
        </Section>
      </ScrollView>

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
              error={end && !TIME_RE.test(end) ? 'HH:MM, 01–12' : undefined}
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
            <MaterialCommunityIcons name="calculator-variant-outline" size={18} color={C.primary} />
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

/** White section card: blush icon circle, serif burgundy title with a gold rule, caption, then content. */
function Section({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: string; children: ReactNode }) {
  return (
    <View style={st.card}>
      <View style={st.head}>
        <View style={st.headIcon}>{icon}</View>
        <View style={{ flex: 1 }}>
          <View style={st.titleRow}>
            <Text style={st.title}>{title}</Text>
            <GoldRule maxWidth={90} />
          </View>
          <Text style={st.sub}>{sub}</Text>
        </View>
      </View>
      {children}
    </View>
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
  const [focus, setFocus] = useState(false);
  return (
    <View style={st.amountCard}>
      <View style={st.amountHead}>
        <View style={st.amountIcon}>
          <MaterialCommunityIcons name={icon} size={16} color={C.primary} />
        </View>
        <Text style={st.amountLabel}>{label}</Text>
      </View>
      <View style={[st.amountField, focus && { borderColor: C.primary }]}>
        <View style={st.rupee}>
          <Text style={st.rupeeText}>₹</Text>
        </View>
        <TextInput
          value={groupINR(value)}
          onChangeText={(v) => onChange(v.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9))}
          placeholder="0"
          placeholderTextColor={C.textMuted}
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

function Bubble({ icon, fg, bg }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; fg: string; bg: string }) {
  return (
    <View style={[st.bubble, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={19} color={fg} />
    </View>
  );
}

/** AM / PM segmented switch under a time field. */
function MeridiemToggle({ value, onChange }: { value: Meridiem; onChange: (v: Meridiem) => void }) {
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
            <Text style={[st.meridiemText, on && { color: C.onPrimary, fontFamily: F.semibold }]}>{ap}</Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  meridiem: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  meridiemItem: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  meridiemOn: { backgroundColor: C.primary },
  meridiemText: { fontFamily: F.medium, fontSize: 14, color: C.text },
  screen: { flex: 1, backgroundColor: C.bg },
  body: { padding: 14, gap: 12, paddingBottom: 32 },

  card: { backgroundColor: C.surface, borderRadius: radius.md, padding: 12, gap: 12, ...elevation },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: F.serifBold, fontSize: 21, lineHeight: 26, color: C.primary },
  sub: { ...T.caption, marginTop: 1 },

  list: { borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingVertical: 6 },
  rowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  bubble: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontFamily: F.semibold, fontSize: 14, color: C.text },
  rowTime: { fontFamily: F.regular, fontSize: 12.5, color: C.textSecondary },
  segTime: { fontFamily: F.medium, fontSize: 12.5, color: C.text, fontVariant: ['tabular-nums'] },

  tabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: C.surfaceAlt,
  },
  tab: { flex: 1, minHeight: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabOn: { backgroundColor: C.primary, borderWidth: 1.2, borderColor: GOLD },
  tabSep: { width: 1, marginVertical: 9, backgroundColor: C.borderStrong },
  tabText: { fontFamily: F.medium, fontSize: 12.5, color: C.text },
  tabTextOn: { fontFamily: F.semibold, color: C.onPrimary },

  rateRow: { minHeight: 46 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rateLabel: { flex: 1, fontFamily: F.regular, fontSize: 14, color: C.text },
  rateAmt: { fontFamily: F.bold, fontSize: 14.5, color: C.text, fontVariant: ['tabular-nums'] },

  sheetFloral: { position: 'absolute', top: -12, right: -20, width: 130, height: 100, opacity: 0.35 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 },
  sheetIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: F.serifBold, fontSize: 21, lineHeight: 25, color: C.primary },
  sheetSub: { fontFamily: F.medium, fontSize: 12.5, lineHeight: 16, color: C.textSecondary },

  amountCard: { backgroundColor: C.surface, borderRadius: radius.md, padding: 10, gap: 8, ...elevation },
  amountHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: { flex: 1, fontFamily: F.semibold, fontSize: 13, color: C.text },
  amountField: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderStrong,
    overflow: 'hidden',
  },
  rupee: { width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceAlt },
  rupeeText: { fontFamily: F.medium, fontSize: 14.5, color: C.textSecondary },
  amountInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontFamily: F.regular,
    fontSize: 14.5,
    color: C.text,
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
    borderColor: '#E9CFA6',
    backgroundColor: '#FDF6EF',
    overflow: 'hidden',
  },
  totalFloral: { position: 'absolute', left: -10, bottom: -18, width: 86, height: 70, opacity: 0.4 },
  totalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  totalLabel: { flex: 1, fontFamily: F.serifBold, fontSize: 16, color: C.primary },
  totalAmt: { flexShrink: 1, fontFamily: F.serifBold, fontSize: 21, color: '#1F5A3E', fontVariant: ['lining-nums'] },
  totalHint: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 15, color: C.textSecondary },
  save: { height: 46, borderWidth: 1.4, borderColor: GOLD },
});
