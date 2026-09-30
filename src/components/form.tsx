import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { glassSurface, GlossTile, GradientFill, Sheen } from '@/components/glass';
import { Touchable, type IconName } from '@/components/primitives';
import { useInPopup } from '@/components/sheet-context';
import { F, noOutline, radius, type Theme } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/** Frosted input surface for popups. */
const glassInput = (t: Theme) => glassSurface(t, t.frost(0.66), 12);

export function TextField({
  label,
  hint,
  error,
  prefix,
  icon,
  right,
  multiline,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  /** Leading glyph inside the field. */
  icon?: ReactNode;
  /** Trailing glyph inside the field. */
  right?: ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  const popup = useInPopup();
  const { C, G, T } = useTheme();
  const st = useSt();
  const disabled = props.editable === false;
  return (
    <View style={{ gap: popup ? 5 : 6 }}>
      {label ? <Text style={[st.label, popup && st.gLabel]}>{label}</Text> : null}
      <View
        style={[
          st.inputWrap,
          popup && st.gInput,
          focus && (popup ? st.gFocus : { borderColor: C.primary, backgroundColor: C.surface }),
          !!error && { borderColor: C.danger },
          disabled && (popup ? st.gDisabled : st.disabled),
          multiline && { minHeight: popup ? 76 : 88, alignItems: 'flex-start' },
        ]}>
        {icon ? <View style={[st.fieldIcon, multiline && { justifyContent: 'flex-start', paddingTop: popup ? 10 : 12 }]}>{icon}</View> : null}
        {prefix ? <Text style={[st.prefix, popup && { color: G.muted, fontSize: 13 }]}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={popup ? G.placeholder : C.textMuted}
          multiline={multiline}
          onFocus={(e) => {
            setFocus(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            props.onBlur?.(e);
          }}
          style={[st.input, popup && st.gInputText, disabled && { color: popup ? G.muted : C.textSecondary }, multiline && { textAlignVertical: 'top', paddingTop: popup ? 10 : 12 }, style]}
          {...props}
        />
        {right ? <View style={st.fieldRight}>{right}</View> : null}
      </View>
      {error ? (
        <Text style={[T.caption, { color: C.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[T.caption, popup && { color: G.muted, fontSize: 11 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  right,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  right?: ReactNode;
}) {
  const popup = useInPopup();
  const { C, G } = useTheme();
  const st = useSt();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={[st.search, popup && st.gSearch]}>
        <Ionicons name="search-outline" size={popup ? 16 : 18} color={popup ? G.blue : C.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={popup ? G.placeholder : C.textMuted}
          style={[st.searchInput, popup && st.gInputText]}
          returnKeyType="search"
        />
        {value ? (
          <Touchable hitSlop={10} onPress={() => onChangeText('')}>
            <Ionicons name="close-circle" size={18} color={popup ? G.placeholder : C.textMuted} />
          </Touchable>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Pill-style segmented tabs; the active tab is filled with the brand blue. */
export function SegmentedTabs<K extends string>({
  options,
  value,
  onChange,
  variant = 'solid',
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  variant?: 'solid' | 'soft';
}) {
  const popup = useInPopup();
  const { C, G } = useTheme();
  const st = useSt();
  if (popup) {
    return (
      <View style={[st.tabs, st.gTabs]}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Touchable
              key={o.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(o.key)}
              style={[st.tab, st.gTab, on && st.gTabOn]}>
              {on ? <GradientFill from={G.gradFrom} to={G.gradTo} radius={12} horizontal /> : null}
              {on ? <Sheen radius={12} strength={0.4} height="50%" /> : null}
              <Text numberOfLines={1} style={[st.gTabText, on && { color: G.onBlue, fontFamily: F.semibold }]}>
                {o.label}
              </Text>
            </Touchable>
          );
        })}
      </View>
    );
  }
  return (
    <View style={st.tabs}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Touchable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[
              st.tab,
              on && (variant === 'solid' ? { backgroundColor: C.primary } : st.tabSoftOn),
            ]}>
            <Text
              numberOfLines={1}
              style={[
                st.tabText,
                on && { color: variant === 'solid' ? C.onPrimary : C.primary, fontFamily: F.semibold },
              ]}>
              {o.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  glyph,
  tint,
  highlight,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Custom leading glyph; receives whether the chip is selected so it can switch colour. */
  glyph?: (active: boolean) => ReactNode;
  /** Optional dot colour shown before the label. */
  tint?: string;
  /** Popup only: outline and glow marking a quick-fill choice that matches the current value. */
  highlight?: boolean;
}) {
  const popup = useInPopup();
  const { C, G } = useTheme();
  const st = useSt();
  if (popup) {
    return (
      <Touchable
        onPress={onPress}
        accessibilityState={{ selected: active }}
        style={[st.chip, st.gChip, highlight && !active && st.gChipHi, active && st.gChipOn]}>
        {active ? <GradientFill from={G.gradFrom} to={G.gradTo} radius={17} /> : null}
        {active ? <Sheen radius={17} strength={0.35} height="50%" /> : null}
        {tint ? <View style={[st.chipDot, { backgroundColor: tint }]} /> : null}
        {/* Wrapped so raw SVG glyphs stack above the absolute gradient fill on web. */}
        {glyph ? <View>{glyph(!!active)}</View> : icon ? <Ionicons name={icon} size={16} color={active ? G.onBlue : G.navy} /> : null}
        <Text selectable={false} style={[st.gChipText, highlight && { color: G.deep, fontFamily: F.semibold }, active && { color: G.onBlue, fontFamily: F.semibold }]}>
          {label}
        </Text>
      </Touchable>
    );
  }
  return (
    <Touchable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      style={[st.chip, active && { backgroundColor: C.primarySoft, borderColor: C.primary }]}>
      {tint ? <View style={[st.chipDot, { backgroundColor: tint }]} /> : null}
      {icon ? <Ionicons name={icon} size={15} color={active ? C.primary : C.textSecondary} /> : null}
      <Text selectable={false} style={[st.chipText, active && { color: C.primary, fontFamily: F.semibold }]}>{label}</Text>
    </Touchable>
  );
}

/** Large selectable option card (used for slots, statuses, payment methods). */
export function OptionCard({
  title,
  subtitle,
  selected,
  disabled,
  onPress,
  icon,
  right,
  action,
}: {
  /** `action` rows open something (chevron); otherwise the row is a choice (radio). */
  action?: boolean;
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: IconName;
  right?: ReactNode;
}) {
  const popup = useInPopup();
  const { C, G, T, tone } = useTheme();
  const st = useSt();
  if (popup) {
    return (
      <Touchable
        disabled={disabled}
        onPress={onPress}
        accessibilityState={{ selected, disabled }}
        style={[st.option, st.gOption, selected && st.gFocus]}>
        <Sheen radius={12} strength={0.45} height="45%" />
        {icon ? (
          <GlossTile from={selected ? G.gradFrom : tone.blue.from} to={selected ? G.gradTo : tone.blue.to} radius={10} style={st.gOptionIcon}>
            <Ionicons name={icon} size={17} color={selected ? G.onBlue : tone.blue.fg} />
          </GlossTile>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[st.gOptionTitle, selected && { color: G.deep, fontFamily: F.semibold }]}>{title}</Text>
          {subtitle ? <Text style={st.gOptionSub}>{subtitle}</Text> : null}
        </View>
        {right}
        {action ? (
          <Ionicons name="chevron-forward" size={15} color={G.navy} />
        ) : (
          <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? G.blue : G.placeholder} />
        )}
      </Touchable>
    );
  }
  return (
    <Touchable
      disabled={disabled}
      onPress={onPress}
      accessibilityState={{ selected, disabled }}
      style={[st.option, selected && st.optionOn]}>
      {icon ? (
        <View style={[st.optionIcon, selected && { backgroundColor: C.primary }]}>
          <Ionicons name={icon} size={18} color={selected ? C.onPrimary : C.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[T.bodyMedium, selected && { color: C.primaryDark, fontFamily: F.semibold }]}>{title}</Text>
        {subtitle ? <Text style={T.secondary}>{subtitle}</Text> : null}
      </View>
      {right}
      {action ? (
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      ) : (
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={selected ? C.primary : C.borderStrong}
        />
      )}
    </Touchable>
  );
}

const useSt = makeStyles((t: Theme) => {
  const { C, G } = t;
  return StyleSheet.create({
  label: { fontFamily: F.medium, fontSize: 12.5, lineHeight: 17, letterSpacing: 0.2, color: C.text },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.md,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
  },
  prefix: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary, marginRight: 6 },
  input: { flex: 1, fontFamily: F.regular, fontSize: 14, color: C.text, paddingVertical: 12, outlineWidth: 0, ...noOutline },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 14, color: C.text, height: '100%', outlineWidth: 0, ...noOutline },
  tabs: {
    flexDirection: 'row',
    backgroundColor: C.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabSoftOn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  tabText: { fontFamily: F.medium, fontSize: 13.5, color: C.textSecondary },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: F.medium, fontSize: 13, color: C.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  optionOn: { borderColor: C.primary, backgroundColor: C.primarySoft },

  // Blue glass variants used inside popups.
  fieldIcon: { marginRight: 11, alignSelf: 'stretch', justifyContent: 'center' },
  fieldRight: { marginLeft: 8 },
  gLabel: { fontFamily: F.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2, color: G.ink },
  gInput: { ...glassInput(t), minHeight: 42, paddingHorizontal: 14 },
  gFocus: { borderColor: G.focusBorder, boxShadow: G.focusGlow },
  gInputText: { fontFamily: F.regular, fontSize: 13.5, color: G.ink, paddingVertical: 10 },
  disabled: { backgroundColor: C.surfaceAlt, borderColor: C.border },
  gDisabled: { backgroundColor: t.frost(0.4), boxShadow: 'none' },
  gSearch: { ...glassInput(t), height: 40, paddingHorizontal: 13 },
  gTabs: { ...glassSurface(t, t.frost(0.5), 14), padding: 2 },
  gTab: { minHeight: 32, borderRadius: 12 },
  gTabOn: { borderWidth: 1.5, borderColor: G.buttonBorder, boxShadow: G.buttonGlow },
  gTabText: { fontFamily: F.medium, fontSize: 12, color: G.ink },
  gChip: { ...glassSurface(t, t.frost(0.6), 17), minHeight: 34, paddingHorizontal: 14, gap: 8 },
  gChipOn: { borderColor: G.buttonBorder, boxShadow: G.buttonGlow },
  gChipHi: { borderColor: G.focusBorder, backgroundColor: t.tint(0.8), boxShadow: G.focusGlow },
  gChipText: { fontFamily: F.medium, fontSize: 12.5, color: G.ink },
  gOption: { ...glassInput(t), borderRadius: 12, minHeight: 52, padding: 9, gap: 11, borderWidth: 1.5 },
  gOptionIcon: { width: 34, height: 34 },
  gOptionTitle: { fontFamily: F.medium, fontSize: 13, color: G.ink },
  gOptionSub: { fontFamily: F.regular, fontSize: 11, color: G.muted },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
});
