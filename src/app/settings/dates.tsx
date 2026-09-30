import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useId, useState, type ReactNode } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { type MciName } from '@/components/brand-page';
import { CalendarGrid, MonthHeader, type YM } from '@/components/calendar';
import { glassSurface, GlossTile, GradientFill, Sheen } from '@/components/glass';
import { GlassActionButton } from '@/components/glass-action';
import { GlassBackdrop, GlassCta, GlassPageHeader } from '@/components/glass-header';
import { BottomSheet, ConfirmDialog, useToast } from '@/components/overlays';
import { ScrollFade, Touchable, useSmoothScroll } from '@/components/primitives';
import { fmtFull, fmtLong, MONTHS, parseISO, toISO, todayISO } from '@/lib/format';
import { DATE_TYPE_META, useStore, type DateType, type ImportantDate } from '@/lib/store';
import { F, noOutline, radius, type Theme, type Tone } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

type Filter = 'all' | DateType;
const TYPES = Object.keys(DATE_TYPE_META) as DateType[];
const FILTERS: Filter[] = ['all', ...TYPES];

const SHEET_FLORAL = require('../../../assets/images/customer/floral-top.png');

/** Chip icon per type; types without one show their colour dot. */
const TYPE_ICON: Partial<Record<DateType, MciName>> = {
  muhurtham: 'star',
  holiday: 'calendar-blank-outline',
};
/** Icon / dot colour per type in the add-date picker. */
const pickColor = (t: Theme): Record<DateType, string> => ({
  muhurtham: t.tone.sand.fg,
  valarpirai: t.tone.violet.fg,
  special: t.D.special.fg,
  holiday: t.C.danger,
});

/** Keeps only digits and inserts the dashes of YYYY-MM-DD as the user types. */
function maskISO(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join('-');
}

const isValidISO = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && toISO(parseISO(v)) === v;

/** Labelled input row: icon cell on the left, input filling the rest. */
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const t = useTheme();
  const st = useSt();
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.label}>{label}</Text>
      <View style={[st.field, !!error && { borderColor: t.C.danger }]}>{children}</View>
      {error ? <Text style={[t.T.caption, { color: t.C.danger }]}>{error}</Text> : null}
    </View>
  );
}

export default function ImportantDatesScreen() {
  const t = useTheme();
  const st = useSt();
  const TYPE_STYLE = typeStyle(t);
  const PICK_COLOR = pickColor(t);
  const { navy: NAVY, blue: ROYAL, blue: BRIGHT } = t.G;
  const { importantDates, addImportantDate, removeImportantDate, typesFor } = useStore();
  const toast = useToast();
  const [year, setYear] = useState(parseISO(todayISO()).getFullYear());
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<ImportantDate | null>(null);

  // Add-date sheet state
  const [pickYm, setPickYm] = useState<YM>({ y: year, m: parseISO(todayISO()).getMonth() });
  const [dateText, setDateText] = useState(todayISO());
  const [showCal, setShowCal] = useState(false);
  const [pickType, setPickType] = useState<DateType>('muhurtham');
  const [title, setTitle] = useState('');
  const { scrollRef, rootRef, scrolled, onScroll } = useSmoothScroll<SectionList<ImportantDate>>();

  const items = importantDates
    .filter((d) => d.date.startsWith(String(year)) && (filter === 'all' || d.type === filter))
    .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
  const sections = MONTHS.map((title, m) => ({
    title,
    data: items.filter((d) => parseISO(d.date).getMonth() === m),
  })).filter((s) => s.data.length > 0);

  const pickDate = isValidISO(dateText) ? dateText : null;
  const dateError = dateText.length === 10 && !pickDate ? 'Enter a real date as YYYY-MM-DD.' : undefined;
  const alreadyExists = !!pickDate && typesFor(pickDate).includes(pickType);

  const openCalendar = () => {
    if (!showCal && pickDate) {
      const d = parseISO(pickDate);
      setPickYm({ y: d.getFullYear(), m: d.getMonth() });
    }
    setShowCal((v) => !v);
  };

  const save = () => {
    if (!pickDate || alreadyExists) return;
    addImportantDate(pickDate, pickType, title.trim());
    setYear(parseISO(pickDate).getFullYear());
    setAdding(false);
    toast(`${DATE_TYPE_META[pickType].label} added`);
  };

  return (
    <View ref={rootRef} style={st.screen}>
      <GlassBackdrop />

      <GlassPageHeader lead="Important" accent="Dates" hallIcon="office-building" />

      <View style={st.top}>
        {/* Year switcher */}
        <View style={[st.yearCard, glassSurface(t, t.frost(0.5), 16)]}>
          <Sheen radius={16} strength={0.55} />
          <Touchable
            onPress={() => setYear((y) => y - 1)}
            accessibilityRole="button"
            accessibilityLabel="Previous year"
            style={[st.center, glassSurface(t, t.frost(0.7), 15), st.yearBtn]}>
            <Ionicons name="chevron-back" size={17} color={NAVY} />
          </Touchable>
          <View style={st.yearMid}>
            <Flourish />
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={NAVY} />
            <Text style={st.year}>{year}</Text>
            <Flourish flip />
          </View>
          <Touchable
            onPress={() => setYear((y) => y + 1)}
            accessibilityRole="button"
            accessibilityLabel="Next year"
            style={[st.center, glassSurface(t, t.frost(0.7), 15), st.yearBtn]}>
            <Ionicons name="chevron-forward" size={17} color={NAVY} />
          </Touchable>
        </View>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filters}>
          {FILTERS.map((f) => {
            const on = filter === f;
            return (
              <Touchable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[st.filter, on ? st.filterOn : glassSurface(t, t.frost(0.55), 14)]}>
                {on ? <GradientFill from={t.tone.blue.from} to={t.tone.blue.to} radius={14} fromOpacity={0.95} toOpacity={0.9} /> : null}
                <Sheen radius={14} strength={0.55} height="50%" />
                {f === 'all' ? (
                  <MaterialCommunityIcons name="view-grid-outline" size={16} color={on ? ROYAL : NAVY} />
                ) : (
                  <View style={[st.dot, { backgroundColor: TYPE_STYLE[f].dot }]} />
                )}
                <Text style={[st.filterText, on && { color: ROYAL }]}>
                  {f === 'all' ? 'All' : DATE_TYPE_META[f].label}
                </Text>
              </Touchable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollFade faded={scrolled}>
      <SectionList
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={onScroll}
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(d) => d.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.list}
        ListEmptyComponent={
          <View style={st.empty}>
            <View style={[st.emptyOrb, glassSurface(t, t.frost(0.55), 32)]}>
              <Sheen radius={32} strength={0.6} height="50%" />
              <Ionicons name="star-outline" size={26} color={NAVY} />
            </View>
            <Text style={st.emptyTitle}>No important dates in {year}</Text>
            <Text style={st.emptyMsg}>Tap Add Date to create one.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={st.monthRow}>
            <Text style={st.month}>{section.title}</Text>
            <MonthRule />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 7 }} />}
        renderItem={({ item, index }) => {
          const d = parseISO(item.date);
          const ts = TYPE_STYLE[item.type];
          // Valarpirai tiles alternate blue and lilac so long runs stay easy to scan.
          const tile = item.type === 'valarpirai' && index % 2 === 0 ? t.tone.blue : ts.tile;
          return (
            <View style={[st.row, glassSurface(t, t.frost(0.58), 12)]}>
              <Sheen radius={12} strength={0.45} height="45%" />
              <GlossTile from={tile.from} to={tile.to} radius={9} style={st.tile}>
                <Text style={st.tileDay}>{String(d.getDate()).padStart(2, '0')}</Text>
                <Text style={st.tileMonth}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
              </GlossTile>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={st.rowDate} numberOfLines={1}>
                  {fmtLong(item.date)}
                </Text>
                <View style={st.typeRow}>
                  <View style={[st.dot, { backgroundColor: ts.dot }]} />
                  <Text style={[st.typeText, { color: ts.text }]}>{DATE_TYPE_META[item.type].label}</Text>
                  {item.title ? (
                    <Text style={st.rowTitle} numberOfLines={1}>
                      · {item.title}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Touchable
                onPress={() => setToDelete(item)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${fmtLong(item.date)}`}
                hitSlop={6}>
                <GlossTile from={t.tone.rose.from} to={t.tone.rose.to} radius={8} style={st.trash}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={t.C.danger} />
                </GlossTile>
              </Touchable>
            </View>
          );
        }}
      />
      </ScrollFade>

      <GlassCta
        title="Add Date"
        icon={<Ionicons name="add" size={20} color={t.G.onBlue} />}
        onPress={() => {
          setDateText(todayISO());
          setShowCal(false);
          setPickType('muhurtham');
          setTitle('');
          setAdding(true);
        }}
      />

      <BottomSheet
        visible={adding}
        onClose={() => setAdding(false)}
        backdropColor={t.dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(30, 30, 30, 0.06)'}
        header={
          <View style={st.sheetHead}>
            <Image source={SHEET_FLORAL} tintColor={t.lightBlue} style={st.sheetFloral} contentFit="contain" pointerEvents="none" />
            <View style={[st.sheetIcon, glassSurface(t, t.frost(0.6), 14)]}>
              <Sheen radius={14} strength={0.6} height="50%" />
              <MaterialCommunityIcons name="calendar-star" size={26} color={ROYAL} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.sheetTitle}>
                Add <Text style={{ color: BRIGHT }}>important date</Text>
              </Text>
              <Text style={st.sheetSub}>Mark special dates for easy reference.</Text>
            </View>
          </View>
        }
        footer={
          <GlassActionButton
            title="Save"
            variant="blue"
            icon="calendar"
            lotus
            height={52}
            disabled={!pickDate || alreadyExists}
            onPress={save}
          />
        }>
        <View style={[st.panel, glassSurface(t, t.frost(0.32), 18)]}>
        <Field label="Date (YYYY-MM-DD)" error={dateError}>
          <Touchable
            onPress={openCalendar}
            accessibilityRole="button"
            accessibilityLabel={showCal ? 'Hide calendar' : 'Pick from calendar'}
            style={[st.fieldIcon, showCal && { backgroundColor: t.lightBlue }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={19} color={ROYAL} />
          </Touchable>
          <TextInput
            value={dateText}
            onChangeText={(v) => setDateText(maskISO(v))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={t.G.placeholder}
            keyboardType="number-pad"
            maxLength={10}
            accessibilityLabel="Date"
            style={st.fieldInput}
          />
        </Field>

        {showCal ? (
          <View style={st.pickCard}>
            <MonthHeader ym={pickYm} onChange={setPickYm} />
            <CalendarGrid
              ym={pickYm}
              selected={pickDate}
              onSelect={(iso) => {
                setDateText(iso);
                setShowCal(false);
              }}
              showIndicators={false}
            />
          </View>
        ) : null}

        <View style={{ gap: 6 }}>
          <Text style={st.label}>Date type</Text>
          <View style={st.types}>
            {TYPES.map((ty) => {
              const on = pickType === ty;
              const icon = TYPE_ICON[ty];
              return (
                <Touchable
                  key={ty}
                  onPress={() => setPickType(ty)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[st.type, on ? st.typeOn : glassSurface(t, t.frost(0.6), 12)]}>
                  {on ? <GradientFill from={t.tone.sand.from} to={t.tone.sand.to} radius={12} /> : null}
                  <Sheen radius={12} strength={0.55} height="50%" />
                  {icon ? (
                    <MaterialCommunityIcons name={icon} size={19} color={PICK_COLOR[ty]} />
                  ) : (
                    <View style={[st.typeDot, { backgroundColor: PICK_COLOR[ty] }]} />
                  )}
                  <Text style={[st.typeLabel, on && st.typeLabelOn]}>{DATE_TYPE_META[ty].label}</Text>
                </Touchable>
              );
            })}
          </View>
        </View>

        <Field label="Title (optional)">
          <View style={st.fieldIcon}>
            <Ionicons name="document-text-outline" size={18} color={NAVY} />
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Thai Poosam, Pongal..."
            placeholderTextColor={t.G.placeholder}
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel="Title"
            style={st.fieldInput}
          />
        </Field>
        </View>

        {alreadyExists ? (
          <View style={st.warn}>
            <Ionicons name="information-circle-outline" size={16} color={t.C.warning} />
            <Text style={[t.T.caption, { color: t.C.warning }]}>This date is already marked {DATE_TYPE_META[pickType].label}.</Text>
          </View>
        ) : null}
      </BottomSheet>

      <ConfirmDialog
        visible={!!toDelete}
        destructive
        title="Delete this date?"
        message={toDelete ? `${fmtFull(toDelete.date)} will no longer be marked ${DATE_TYPE_META[toDelete.type].label}. Rates for that day will change.` : ''}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) removeImportantDate(toDelete.id);
          setToDelete(null);
          toast('Date removed');
        }}
      />
    </View>
  );
}

/** Per-type dot, label and tile colours for the glass list. */
const typeStyle = (t: Theme): Record<DateType, { dot: string; text: string; tile: Tone }> => ({
  muhurtham: { dot: t.tone.sand.fg, text: t.D.muhurtham.fg, tile: t.tone.sand },
  valarpirai: { dot: t.tone.violet.fg, text: t.D.valarpirai.fg, tile: t.tone.violet },
  special: { dot: t.D.special.fg, text: t.D.special.fg, tile: t.tone.mint },
  holiday: { dot: t.tone.rose.fg, text: t.D.holiday.fg, tile: t.tone.rose },
});

/** Filigree beside the year: hairlines either side of a small knot of loops around a diamond. */
function Flourish({ flip }: { flip?: boolean }) {
  const t = useTheme();
  const FILIGREE = t.dark ? '#6B5A3A' : '#C9B384';
  return (
    <Svg width={62} height={14} viewBox="0 0 62 14" style={flip ? { transform: [{ scaleX: -1 }] } : undefined} pointerEvents="none">
      <Path d="M0 7H21" stroke={FILIGREE} strokeWidth={0.8} strokeOpacity={0.6} />
      <Path d="M41 7H62" stroke={FILIGREE} strokeWidth={0.8} strokeOpacity={0.9} />
      <Path d="M26 7C24 3.5 20.5 3.8 21.5 6.2C22.3 8 24.6 7.4 26 7C24 10.5 20.5 10.2 21.5 7.8" stroke={FILIGREE} strokeWidth={0.8} fill="none" />
      <Path d="M36 7C38 3.5 41.5 3.8 40.5 6.2C39.7 8 37.4 7.4 36 7C38 10.5 41.5 10.2 40.5 7.8" stroke={FILIGREE} strokeWidth={0.8} fill="none" />
      <Path d="M31 2.2L35.8 7L31 11.8L26.2 7Z" stroke={FILIGREE} strokeWidth={0.9} fill={t.highlight} fillOpacity={t.dark ? 0.12 : 0.7} />
      <Circle cx={31} cy={7} r={1.2} fill={FILIGREE} />
    </Svg>
  );
}

/** Blue hairline after a month label, fading out to the right. */
function MonthRule() {
  const t = useTheme();
  const id = 'mr' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={70} height={2} viewBox="0 0 70 2" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={t.G.blue} stopOpacity={0.9} />
          <Stop offset="1" stopColor={t.G.blue} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width={70} height={1.4} y={0.3} fill={`url(#${id})`} />
    </Svg>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    top: { paddingTop: 14, gap: 8 },
    yearCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, paddingHorizontal: 8, height: 52 },
    yearBtn: { width: 34, height: 34 },
    yearMid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    year: { fontFamily: F.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.2, color: t.G.ink, fontVariant: ['lining-nums'] },
    filters: { gap: 7, paddingHorizontal: 11, paddingVertical: 8 },
    filter: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17 },
    filterOn: {
      paddingHorizontal: 15,
      borderWidth: 1.2,
      borderColor: t.G.focusBorder,
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 8px 20px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 3px 8px rgba(30, 30, 30, 0.08)',
    },
    filterText: { fontFamily: F.medium, fontSize: 12.5, color: t.G.ink },
    empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 24 },
    emptyOrb: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontFamily: F.semibold, fontSize: 16, lineHeight: 21, color: t.G.ink, textAlign: 'center', fontVariant: ['lining-nums'] },
    emptyMsg: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: t.G.muted, textAlign: 'center', marginTop: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    list: { paddingHorizontal: 18, paddingBottom: 12 },
    monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 7 },
    month: { fontFamily: F.medium, fontSize: 11, lineHeight: 15, letterSpacing: 0.8, color: t.G.muted, textTransform: 'uppercase' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 54, paddingLeft: 8, paddingRight: 9 },
    tile: { width: 58, height: 40 },
    tileDay: { fontFamily: F.semibold, fontSize: 15.5, lineHeight: 18, letterSpacing: -0.2, color: t.G.ink, fontVariant: ['lining-nums'] },
    tileMonth: { fontFamily: F.medium, fontSize: 9.5, lineHeight: 12, letterSpacing: 0.4, color: t.G.ink },
    rowDate: { fontFamily: F.semibold, fontSize: 13.5, lineHeight: 18, color: t.G.ink, fontVariant: ['lining-nums'] },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeText: { fontFamily: F.regular, fontSize: 12, lineHeight: 16 },
    rowTitle: { flexShrink: 1, fontFamily: F.regular, fontSize: 12, color: t.G.muted },
    trash: { width: 33, height: 33 },
    sheetFloral: { position: 'absolute', top: -22, right: 18, width: 110, height: 84, opacity: 0.55 },
    sheetHead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
    sheetIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    sheetTitle: { fontFamily: F.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3, color: t.G.ink },
    sheetSub: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: t.G.muted, marginTop: 2 },
    panel: { padding: 12, paddingTop: 14, gap: 12 },
    label: { fontFamily: F.medium, fontSize: 12, color: t.G.ink },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
      borderRadius: 12,
      borderWidth: 1.2,
      borderColor: t.glassBorder,
      backgroundColor: t.frost(0.55),
      overflow: 'hidden',
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 2px 8px ${t.shadow}`
        : `inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 2px 8px ${t.shadow}`,
    },
    fieldIcon: {
      width: 44,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.tint(0.55),
    },
    fieldInput: {
      flex: 1,
      alignSelf: 'stretch',
      paddingHorizontal: 12,
      fontFamily: F.regular,
      fontSize: 14,
      color: t.G.ink,
      fontVariant: ['lining-nums'],
      ...noOutline,
    },
    types: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
    type: {
      flexBasis: '46%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      height: 38,
      paddingHorizontal: 16,
    },
    typeOn: {
      borderRadius: 12,
      borderWidth: 1.4,
      borderColor: t.dark ? 'rgba(201, 164, 94, 0.5)' : '#DCC285',
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.06), 0px 8px 20px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 3px 8px rgba(120, 85, 20, 0.08)',
    },
    typeDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      boxShadow: t.dark
        ? 'inset 0px 1px 0px rgba(255, 255, 255, 0.12)'
        : 'inset 0px 1px 1px rgba(255, 255, 255, 0.45), inset 0px -1px 2px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(30, 30, 30, 0.08)',
    },
    typeLabel: { fontFamily: F.medium, fontSize: 13, color: t.G.ink },
    typeLabelOn: { fontFamily: F.semibold, color: t.C.accentText },
    pickCard: {
      backgroundColor: t.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: t.C.border,
      padding: 8,
    },
    warn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  }),
);
