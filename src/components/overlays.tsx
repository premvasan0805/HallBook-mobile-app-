import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOutUp, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlossTile, GradientFill, Sheen } from '@/components/glass';
import { IconButton, PrimaryButton, SecondaryButton } from '@/components/primitives';
import { InPopupContext } from '@/components/sheet-context';
import { APP_MAX_WIDTH, appWidth, F } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

const SHEET_R = 28;

/** Web: the page shows through the sheet, blurred. Native has no backdrop filter, so the fill stays near-opaque. */
const FROSTED = Platform.OS === 'web';
const frostBlur = FROSTED
  ? ({ backdropFilter: 'blur(35px) saturate(1.4)', WebkitBackdropFilter: 'blur(35px) saturate(1.4)' } as unknown as ViewStyle)
  : null;

/** Wrapper that keeps modal content inside the phone column on web. */
function Column({ children, center }: { children: ReactNode; center?: boolean }) {
  const { width } = useWindowDimensions();
  const st = useSt();
  return <View style={[st.column, { width: appWidth(width) }, center ? st.center : st.bottom]}>{children}</View>;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  header,
  backdropColor,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Replaces the plain title/subtitle block; the close button stays on the right. */
  header?: ReactNode;
  /** Overrides the dimming behind the sheet. */
  backdropColor?: string;
}) {
  const { height } = useWindowDimensions();
  const st = useSt();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <InPopupContext.Provider value>
        <Column>
          <Animated.View entering={FadeIn.duration(160)} style={[st.backdrop, backdropColor ? { backgroundColor: backdropColor } : null]}>
            <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
          </Animated.View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View entering={SlideInDown.duration(240)} style={[st.sheet, frostBlur, { maxHeight: height * 0.9 }]}>
              <SheetGlass radius={SHEET_R} />
              <View style={st.grabber} />
              {header || title ? (
                <View style={st.sheetHead}>
                  {header ?? (
                    <View style={{ flex: 1 }}>
                      <Text style={st.sheetTitle}>{title}</Text>
                      {subtitle ? <Text style={st.sheetSub}>{subtitle}</Text> : null}
                    </View>
                  )}
                  <IconButton icon="close" size={34} onPress={onClose} accessibilityLabel="Close" />
                </View>
              ) : null}
              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={st.sheetBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
              <SafeAreaView edges={['bottom']} style={{ paddingTop: footer ? 10 : 0 }}>
                {footer}
              </SafeAreaView>
            </Animated.View>
          </KeyboardAvoidingView>
        </Column>
      </InPopupContext.Provider>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const st = useSt();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <InPopupContext.Provider value>
        <Column center>
          <Animated.View entering={FadeIn.duration(140)} style={st.backdrop}>
            <Pressable style={{ flex: 1 }} onPress={onCancel} />
          </Animated.View>
          <Animated.View entering={ZoomIn.duration(180)} style={[st.dialog, frostBlur]}>
            <SheetGlass radius={22} />
            <GlossTile
              from={destructive ? t.tone.rose.from : t.tone.blue.from}
              to={destructive ? t.tone.rose.to : t.tone.blue.to}
              radius={24}
              style={st.dialogIcon}>
              <Ionicons
                name={destructive ? 'alert-circle-outline' : 'help-circle-outline'}
                size={24}
                color={destructive ? t.C.danger : t.G.blue}
              />
            </GlossTile>
            <Text style={st.dialogTitle}>{title}</Text>
            {message ? <Text style={st.dialogMsg}>{message}</Text> : null}
            <View style={{ gap: 9, alignSelf: 'stretch', marginTop: 8 }}>
              {destructive ? (
                <Touch label={confirmLabel} onPress={onConfirm} />
              ) : (
                <PrimaryButton title={confirmLabel} onPress={onConfirm} />
              )}
              <SecondaryButton title={cancelLabel} onPress={onCancel} />
            </View>
          </Animated.View>
        </Column>
      </InPopupContext.Provider>
    </Modal>
  );
}

/** Strong frosted glass for a popup: warm white (≈0.72) in light mode, smoked warm glass in dark, faint sheen on top. */
function SheetGlass({ radius }: { radius: number }) {
  const t = useTheme();
  return (
    <>
      <GradientFill
        from={t.dark ? '#26221C' : '#FFFFFF'}
        to={t.dark ? '#16140F' : '#FAF6EC'}
        radius={radius}
        fromOpacity={FROSTED ? (t.dark ? 0.78 : 0.76) : 0.97}
        toOpacity={FROSTED ? (t.dark ? 0.84 : 0.68) : 0.97}
      />
      <Sheen radius={radius} strength={0.5} height="18%" />
    </>
  );
}

/** Soft coral confirm button for destructive dialogs. */
function Touch({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  const st = useSt();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.dangerBtn, pressed && { opacity: 0.85 }]}
      accessibilityRole="button">
      <GradientFill from={t.dark ? '#B8646A' : '#CD6A70'} to={t.dark ? '#9C4E55' : t.C.danger} radius={11} />
      <Sheen radius={11} strength={0.25} height="50%" />
      <Text style={st.dangerText}>{label}</Text>
    </Pressable>
  );
}

// ---------- Toast ----------

type Toast = { id: number; message: string; tone: 'success' | 'error' };
const ToastCtx = createContext<(message: string, tone?: Toast['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const st = useSt();

  const show = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[st.toastWrap, { top: insets.top + 8 }]}>
          <Animated.View key={toast.id} entering={FadeInUp.duration(200)} exiting={FadeOutUp} style={st.toast}>
            <GradientFill from={t.G.gradFrom} to={t.G.gradTo} radius={13} horizontal />
            <Sheen radius={13} strength={0.25} height="50%" />
            <Ionicons
              name={toast.tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={toast.tone === 'success' ? t.C.onPrimarySoft : t.dark ? t.C.danger : t.C.dangerBorder}
            />
            <Text style={st.toastText}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

const useSt = makeStyles((t) =>
  StyleSheet.create({
    column: { flex: 1, alignSelf: 'center', overflow: 'hidden' },
    bottom: { justifyContent: 'flex-end' },
    center: { justifyContent: 'center', padding: 24 },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: t.G.overlay },
    sheet: {
      borderTopLeftRadius: SHEET_R,
      borderTopRightRadius: SHEET_R,
      paddingHorizontal: 18,
      paddingBottom: 12,
      borderWidth: 1.5,
      borderBottomWidth: 0,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.75)',
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.12), 0px -8px 30px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px -8px 30px rgba(30, 30, 30, 0.10)',
    },
    grabber: {
      alignSelf: 'center',
      width: 40,
      height: 4.5,
      borderRadius: 3,
      backgroundColor: t.dark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(37, 37, 37, 0.18)',
      marginTop: 10,
      marginBottom: 12,
    },
    sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2, paddingBottom: 14, paddingLeft: 12 },
    sheetTitle: { fontFamily: F.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3, color: t.G.ink },
    sheetSub: { fontFamily: F.regular, fontSize: 12, lineHeight: 17, color: t.G.ink, marginTop: 2, letterSpacing: 0 },
    /** Small inset so child glass rims and glows are not clipped by the scroll view. */
    sheetBody: { gap: 12, paddingBottom: 8, paddingHorizontal: 3, paddingTop: 3 },
    dialog: {
      borderRadius: 22,
      padding: 22,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1.5,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.75)',
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.12), 0px 14px 34px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 14px 34px rgba(30, 30, 30, 0.14)',
    },
    dialogIcon: { width: 48, height: 48, marginBottom: 4 },
    dialogTitle: { fontFamily: F.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: t.G.ink, textAlign: 'center' },
    dialogMsg: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: t.G.muted, textAlign: 'center' },
    dangerBtn: {
      minHeight: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: t.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.5)',
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.1), 0px 4px 12px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.3), 0px 4px 12px rgba(194, 84, 90, 0.18)',
    },
    dangerText: { fontFamily: F.semibold, fontSize: 14, color: t.G.onBlue },
    toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      maxWidth: APP_MAX_WIDTH - 40,
      borderWidth: 1.2,
      borderColor: t.G.buttonBorder,
      boxShadow: t.dark
        ? `inset 0px 1px 0px rgba(255, 255, 255, 0.1), 0px 8px 20px ${t.shadow}`
        : 'inset 0px 1px 0px rgba(255, 255, 255, 0.3), 0px 8px 20px rgba(30, 30, 30, 0.14)',
    },
    toastText: { fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: t.G.onBlue, flexShrink: 1 },
  }),
);
