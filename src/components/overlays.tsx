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
import { APP_MAX_WIDTH, appWidth, C, F, G } from '@/lib/theme';

const SHEET_R = 28;

/** Web: the page shows through the sheet, blurred. Native has no backdrop filter, so the fill stays near-opaque. */
const FROSTED = Platform.OS === 'web';
const frostBlur = FROSTED
  ? ({ backdropFilter: 'blur(26px) saturate(1.5)', WebkitBackdropFilter: 'blur(26px) saturate(1.5)' } as unknown as ViewStyle)
  : null;

/** Wrapper that keeps modal content inside the phone column on web. */
function Column({ children, center }: { children: ReactNode; center?: boolean }) {
  const { width } = useWindowDimensions();
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
              from={destructive ? '#FEF0F3' : '#EEF5FE'}
              to={destructive ? '#FAD6DE' : '#D3E4FB'}
              radius={24}
              style={st.dialogIcon}>
              <Ionicons
                name={destructive ? 'alert-circle-outline' : 'help-circle-outline'}
                size={24}
                color={destructive ? C.danger : G.blue}
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

/** Pale blue frosted fill for a popup: soft vertical gradient plus a bright sheen across the top. */
function SheetGlass({ radius }: { radius: number }) {
  return (
    <>
      <GradientFill from="#F8FBFF" to="#E1EBFA" radius={radius} fromOpacity={FROSTED ? 0.66 : 1} toOpacity={FROSTED ? 0.6 : 1} />
      <Sheen radius={radius} strength={0.7} height="18%" />
    </>
  );
}

/** Glossy red confirm button for destructive dialogs. */
function Touch({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.dangerBtn, pressed && { opacity: 0.85 }]}
      accessibilityRole="button">
      <GradientFill from="#E0485A" to="#A51F31" radius={11} />
      <Sheen radius={11} strength={0.35} height="50%" />
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
            <GradientFill from="#3A6FD0" to="#1C3F8E" radius={13} horizontal />
            <Sheen radius={13} strength={0.3} height="50%" />
            <Ionicons
              name={toast.tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={toast.tone === 'success' ? '#BFE0FF' : C.dangerBorder}
            />
            <Text style={st.toastText}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

const st = StyleSheet.create({
  column: { flex: 1, alignSelf: 'center', overflow: 'hidden' },
  bottom: { justifyContent: 'flex-end' },
  center: { justifyContent: 'center', padding: 24 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(19, 29, 56, 0.22)' },
  sheet: {
    borderTopLeftRadius: SHEET_R,
    borderTopRightRadius: SHEET_R,
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow:
      'inset 0px 2px 0px rgba(255, 255, 255, 1), inset 0px 0px 24px rgba(255, 255, 255, 0.8), 0px 0px 18px rgba(255, 255, 255, 0.6), 0px -8px 30px rgba(31, 58, 112, 0.18)',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(79, 134, 230, 0.75)',
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2, paddingBottom: 14, paddingLeft: 12 },
  sheetTitle: { fontFamily: F.pageSerifBold, fontSize: 21, lineHeight: 27, letterSpacing: -0.3, color: G.ink },
  sheetSub: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: G.ink, marginTop: 2, letterSpacing: 0.3 },
  /** Small inset so child glass rims and glows are not clipped by the scroll view. */
  sheetBody: { gap: 12, paddingBottom: 8, paddingHorizontal: 3, paddingTop: 3 },
  dialog: {
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow:
      'inset 0px 2px 0px rgba(255, 255, 255, 1), inset 0px 0px 22px rgba(255, 255, 255, 0.8), 0px 0px 20px rgba(255, 255, 255, 0.5), 0px 14px 34px rgba(19, 29, 56, 0.25)',
  },
  dialogIcon: { width: 48, height: 48, marginBottom: 4 },
  dialogTitle: { fontFamily: F.pageSerifBold, fontSize: 18, lineHeight: 23, color: G.ink, textAlign: 'center' },
  dialogMsg: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: G.muted, textAlign: 'center' },
  dangerBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 220, 225, 0.95)',
    boxShadow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.5), 0px 0px 12px rgba(224, 72, 90, 0.35), 0px 6px 14px rgba(165, 31, 49, 0.25)',
  },
  dangerText: { fontFamily: F.semibold, fontSize: 14.5, color: '#FFFFFF' },
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
    borderColor: 'rgba(200, 222, 255, 0.9)',
    boxShadow: '0px 0px 14px rgba(90, 145, 240, 0.45), 0px 8px 20px rgba(19, 29, 56, 0.25)',
  },
  toastText: { fontFamily: F.medium, fontSize: 13, color: '#FFFFFF', flexShrink: 1 },
});
