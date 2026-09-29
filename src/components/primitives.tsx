import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { glassSurface, GradientFill, Sheen } from '@/components/glass';
import { useInPopup } from '@/components/sheet-context';
import { C, elevation, G, radius, space, T, tabBarClearance } from '@/lib/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

// ---------- Touch ----------

/** Pressable with a consistent pressed state (slight dim + scale). */
export function Touchable({
  style,
  children,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        style,
        pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
        props.disabled && { opacity: 0.5 },
      ]}>
      {children}
    </Pressable>
  );
}

// ---------- Layout ----------

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function AppHeader({
  title,
  back,
  right,
  subtitle,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
  subtitle?: string;
}) {
  return (
    <View style={st.header}>
      {back && <IconButton icon="arrow-back" onPress={goBack} plain accessibilityLabel="Back" />}
      <View style={{ flex: 1 }}>
        <Text style={[T.screenTitle, back && { fontSize: 21, lineHeight: 28 }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={T.secondary}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/**
 * Standard screen: safe-area top, header, scrollable body and optional sticky footer.
 * Tab screens pass `tab`: the body (or footer) ends clear of the floating tab bar instead of padding for the home indicator.
 */
export function Screen({
  title,
  subtitle,
  back,
  right,
  header,
  children,
  footer,
  scroll = true,
  onRefresh,
  tab,
  contentStyle,
  backdrop,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  onRefresh?: () => Promise<void> | void;
  tab?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Full-bleed layer drawn behind the header and body (the page background turns transparent). */
  backdrop?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { scrollRef, rootRef, scrolled, onScroll } = useSmoothScroll<ScrollView>(scroll);
  const clear = tab && !footer ? { paddingBottom: tabBarClearance(insets.bottom) } : null;
  const body = scroll ? (
    <ScrollFade faded={scrolled}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[st.body, contentStyle, clear]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={onRefresh && Platform.OS !== 'web' ? <Refresh onRefresh={onRefresh} /> : undefined}>
        {children}
      </ScrollView>
    </ScrollFade>
  ) : (
    <View style={[st.body, { flex: 1, paddingBottom: 0 }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView ref={rootRef} style={[st.screen, backdrop ? { backgroundColor: 'transparent' } : null]} edges={['top']}>
      {backdrop ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {backdrop}
        </View>
      ) : null}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header ?? (title ? <AppHeader title={title} subtitle={subtitle} back={back} right={right} /> : null)}
        {body}
        {footer ? (
          <SafeAreaView edges={tab ? [] : ['bottom']} style={[st.footer, tab && { paddingBottom: tabBarClearance(insets.bottom) }]}>
            {footer}
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Height (px) of the fade where scrolled content dissolves under the header. */
const SCROLL_FADE = 32;

/**
 * Smooth scrolling for a page's main scroller (ScrollView, FlatList or SectionList): put `scrollRef`,
 * `scrollEventThrottle={16}` and `onScroll` on the scroller, `rootRef` on the screen's outer View, and wrap the
 * scroller in `<ScrollFade faded={scrolled}>`. Web glides mouse-wheel steps (the wheel works anywhere on the
 * screen); both web and native fade the top edge once content has moved, so it slips under the header
 * instead of being cut at a hard line.
 */
export function useSmoothScroll<T>(enabled = true) {
  const scrollRef = useRef<T>(null);
  const rootRef = useRef<View>(null);
  const [scrolled, setScrolled] = useState(false);
  useWebScrollPolish(scrollRef, rootRef, enabled);
  const onScroll =
    Platform.OS === 'web'
      ? undefined
      : (e: { nativeEvent: { contentOffset: { y: number } } }) => setScrolled(e.nativeEvent.contentOffset.y > 1);
  return { scrollRef, rootRef, scrolled, onScroll };
}

/** Native: masks the scroller so its top edge dissolves while `faded`. Web does this with CSS, so it passes through. */
export function ScrollFade({ faded, children }: { faded: boolean; children: ReactNode }) {
  if (Platform.OS === 'web') return <>{children}</>;
  return (
    <MaskedView style={{ flex: 1 }} maskElement={<ScrollFadeMask faded={faded} />}>
      {children}
    </MaskedView>
  );
}

/**
 * Web only: eases mouse-wheel steps into a glide instead of 100px jumps, and fades the top edge of the scroll
 * area once content has moved, so cards slip softly under the header rather than being cut at a hard line.
 * The wheel is caught on the whole screen, so scrolling over the header moves the page too.
 */
function useWebScrollPolish(ref: RefObject<unknown>, rootRef: RefObject<View | null>, enabled: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    const node = (ref.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.();
    if (!node) return;
    const root = rootRef.current as unknown as HTMLElement | null;
    const target0 = root instanceof HTMLElement ? root : node;

    /** True when the wheel is over another vertical scroller (a dropdown, a nested list) that should take it. */
    const ownedElsewhere = (e: WheelEvent) => {
      for (const el of e.composedPath()) {
        if (el === node || el === target0 || !(el instanceof HTMLElement)) break;
        if (el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY)) return true;
      }
      return false;
    };

    const fade = () => {
      const f = Math.min(node.scrollTop, SCROLL_FADE);
      const mask = f > 0 ? `linear-gradient(to bottom, transparent 0px, #000 ${f}px)` : '';
      node.style.maskImage = mask;
      node.style.setProperty('-webkit-mask-image', mask);
    };

    let pos = node.scrollTop;
    let target = pos;
    let frame = 0;
    const step = () => {
      const d = target - pos;
      if (Math.abs(d) < 0.5) {
        pos = target;
        frame = 0;
      } else {
        pos += d * 0.16;
        frame = requestAnimationFrame(step);
      }
      node.scrollTop = pos;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || ownedElsewhere(e)) return;
      const max = node.scrollHeight - node.clientHeight;
      if (max <= 0) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? node.clientHeight : 1;
      if (!frame) pos = target = node.scrollTop;
      target = Math.max(0, Math.min(max, target + e.deltaY * unit));
      if (!frame) frame = requestAnimationFrame(step);
    };

    target0.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('scroll', fade, { passive: true });
    fade();
    return () => {
      target0.removeEventListener('wheel', onWheel);
      node.removeEventListener('scroll', fade);
      cancelAnimationFrame(frame);
    };
  }, [ref, rootRef, enabled]);
}

/** Alpha mask for the native scroll area: opaque everywhere, with a clear-to-solid band at the top while scrolled. */
function ScrollFadeMask({ faded }: { faded: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: SCROLL_FADE, backgroundColor: faded ? 'transparent' : '#000' }}>
        {faded ? (
          <Svg width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="scrollFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000" stopOpacity={0} />
                <Stop offset="1" stopColor="#000" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width={1} height={1} fill="url(#scrollFade)" />
          </Svg>
        ) : null}
      </View>
      <View style={{ flex: 1, backgroundColor: '#000' }} />
    </View>
  );
}

function Refresh({ onRefresh }: { onRefresh: () => Promise<void> | void }) {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }}
      tintColor={C.primary}
      colors={[C.primary]}
    />
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Touchable onPress={onPress} style={[st.card, style]}>
        {children}
      </Touchable>
    );
  }
  return <View style={[st.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[st.sectionHeader, style]}>
      <Text style={T.section}>{title}</Text>
      {action ? (
        <Touchable onPress={onAction} hitSlop={8} style={st.sectionAction}>
          <Text style={[T.secondary, { color: C.primary, fontFamily: 'Inter_600SemiBold' }]}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.primary} />
        </Touchable>
      ) : null}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: inset }} />;
}

// ---------- Buttons ----------

type BtnProps = {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  /** Popup primary only: overrides the label font (e.g. a serif call-to-action). */
  titleStyle?: StyleProp<TextStyle>;
};

export function PrimaryButton({ title, onPress, icon, disabled, loading, style, compact, titleStyle }: BtnProps) {
  const popup = useInPopup();
  if (popup) {
    // Glossy blue button with a white rim and glow, matching the glass screens' main actions.
    return (
      // Disabled stays glossy (dimmed less than the default 0.5) so the popup keeps its bright call-to-action.
      <Touchable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!(disabled || loading) }}
        onPress={disabled || loading ? undefined : onPress}
        style={[st.btn, st.glassBtn, compact && st.btnCompact, style, (disabled || loading) && { opacity: 0.85 }]}>
        <GradientFill from="#5C9BF5" to="#2459D0" radius={compact ? 9 : 14} />
        <Sheen radius={compact ? 9 : 14} strength={0.35} height="50%" />
        {compact ? null : <ButtonTrails radius={14} />}
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={compact ? 17 : 20} color="#FFFFFF" />}
            <Text style={[st.glassBtnText, titleStyle]}>{title}</Text>
          </>
        )}
      </Touchable>
    );
  }
  return (
    <Touchable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[st.btn, compact && st.btnCompact, { backgroundColor: C.primary }, style]}>
      {loading ? (
        <ActivityIndicator color={C.onPrimary} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={C.onPrimary} />}
          <Text style={[T.button, { color: C.onPrimary }]}>{title}</Text>
        </>
      )}
    </Touchable>
  );
}

/** Faint white light curves across a glossy blue button. */
function ButtonTrails({ radius: r }: { radius: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 50" preserveAspectRatio="none">
        <Path d="M0 40C70 24 130 48 200 34S330 12 400 24" stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={1} fill="none" />
        <Path d="M240 50C290 34 340 22 400 6" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1} fill="none" />
        <Path d="M270 50C315 38 360 28 400 20" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={1} fill="none" />
      </Svg>
    </View>
  );
}

export function SecondaryButton({
  title,
  onPress,
  icon,
  disabled,
  style,
  compact,
  tone = 'primary',
}: BtnProps & { tone?: 'primary' | 'danger' }) {
  const popup = useInPopup();
  if (popup) {
    const color = tone === 'danger' ? C.danger : G.blue;
    return (
      <Touchable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[
          st.btn,
          st.glassGhost,
          compact && st.btnCompact,
          { borderColor: tone === 'danger' ? C.dangerBorder : 'rgba(47, 99, 192, 0.5)' },
          style,
        ]}>
        {icon && <Ionicons name={icon} size={17} color={color} />}
        <Text style={[st.glassBtnText, { color }]}>{title}</Text>
      </Touchable>
    );
  }
  const color = tone === 'danger' ? C.danger : C.primary;
  return (
    <Touchable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        st.btn,
        compact && st.btnCompact,
        { backgroundColor: C.surface, borderWidth: 1.2, borderColor: tone === 'danger' ? C.dangerBorder : C.primary },
        style,
      ]}>
      {icon && <Ionicons name={icon} size={18} color={color} />}
      <Text style={[T.button, { color }]}>{title}</Text>
    </Touchable>
  );
}

export function IconButton({
  icon,
  onPress,
  plain,
  filled,
  size = 44,
  color,
  badge,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress?: () => void;
  plain?: boolean;
  filled?: boolean;
  size?: number;
  color?: string;
  badge?: boolean;
  accessibilityLabel?: string;
}) {
  const popup = useInPopup();
  if (popup && !plain && !filled) {
    // Frosted orb, like the back button on glass pages.
    return (
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={6}
        onPress={onPress}
        style={[st.iconBtn, glassSurface('rgba(255, 255, 255, 0.7)', size / 2), { width: size, height: size }]}>
        <Ionicons name={icon} size={Math.round(size * 0.5)} color={color ?? G.navy} />
        {badge && <View style={st.dotBadge} />}
      </Touchable>
    );
  }
  const bg = filled ? C.primary : plain ? 'transparent' : C.surface;
  const fg = color ?? (filled ? C.onPrimary : plain ? C.text : C.primary);
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      style={[
        st.iconBtn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        !plain && !filled && { borderWidth: 1, borderColor: C.border },
      ]}>
      <Ionicons name={icon} size={plain ? 24 : 20} color={fg} />
      {badge && <View style={st.dotBadge} />}
    </Touchable>
  );
}

// ---------- States ----------

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  action,
  onAction,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  const popup = useInPopup();
  return (
    <View style={st.state}>
      <View style={[st.stateIcon, popup && { backgroundColor: G.soft }]}>
        <Ionicons name={icon} size={26} color={popup ? G.blue : C.primary} />
      </View>
      <Text style={[T.cardTitle, { textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[T.secondary, { textAlign: 'center' }]}>{message}</Text> : null}
      {action ? <SecondaryButton title={action} onPress={onAction} compact style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', message }: { title?: string; message?: string }) {
  return (
    <View style={st.state}>
      <View style={[st.stateIcon, { backgroundColor: C.dangerSoft }]}>
        <Ionicons name="alert-circle-outline" size={26} color={C.danger} />
      </View>
      <Text style={[T.cardTitle, { textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[T.secondary, { textAlign: 'center' }]}>{message}</Text> : null}
      <SecondaryButton title="Go back" onPress={goBack} compact style={{ marginTop: 8 }} />
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={[st.state, { flex: 1, justifyContent: 'center' }]}>
      <ActivityIndicator color={C.primary} size="large" />
    </View>
  );
}

/** Pulsing placeholder block for skeleton loading. */
export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ height, width, borderRadius: 8, backgroundColor: C.surfaceAlt }, a, style]} />;
}

export const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
    minHeight: 56,
  },
  body: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: 32, gap: space.md },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: space.lg,
    ...elevation,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  btn: {
    minHeight: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: space.lg,
  },
  btnCompact: { minHeight: 40, borderRadius: radius.sm },
  glassBtn: {
    minHeight: 50,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(210, 228, 255, 0.95)',
    boxShadow:
      'inset 0px 1.5px 0px rgba(255, 255, 255, 0.55), 0px 0px 0px 1px rgba(255, 255, 255, 0.65), 0px 0px 18px rgba(80, 140, 255, 0.55), 0px 8px 18px rgba(28, 72, 176, 0.3)',
  },
  glassGhost: {
    ...glassSurface('rgba(255, 255, 255, 0.78)', 12, 'rgba(31, 58, 112, 0.06)'),
    minHeight: 46,
    borderWidth: 1,
  },
  glassBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15.5, lineHeight: 20, color: '#FFFFFF' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  dotBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  state: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
