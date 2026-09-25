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
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOutUp, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, PrimaryButton, SecondaryButton } from '@/components/primitives';
import { APP_MAX_WIDTH, appWidth, C, F, radius, T } from '@/lib/theme';

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
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Replaces the plain title/subtitle block; the close button stays on the right. */
  header?: ReactNode;
}) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Column>
        <Animated.View entering={FadeIn.duration(160)} style={st.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View entering={SlideInDown.duration(240)} style={[st.sheet, { maxHeight: height * 0.9 }]}>
            <View style={st.grabber} />
            {header || title ? (
              <View style={st.sheetHead}>
                {header ?? (
                  <View style={{ flex: 1 }}>
                    <Text style={T.section}>{title}</Text>
                    {subtitle ? <Text style={T.secondary}>{subtitle}</Text> : null}
                  </View>
                )}
                <IconButton icon="close" size={36} onPress={onClose} accessibilityLabel="Close" />
              </View>
            ) : null}
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 14, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
            <SafeAreaView edges={['bottom']} style={{ paddingTop: footer ? 12 : 0 }}>
              {footer}
            </SafeAreaView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Column>
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
      <Column center>
        <Animated.View entering={FadeIn.duration(140)} style={st.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={onCancel} />
        </Animated.View>
        <Animated.View entering={ZoomIn.duration(180)} style={st.dialog}>
          <View style={[st.dialogIcon, destructive && { backgroundColor: C.dangerSoft }]}>
            <Ionicons
              name={destructive ? 'alert-circle-outline' : 'help-circle-outline'}
              size={26}
              color={destructive ? C.danger : C.primary}
            />
          </View>
          <Text style={[T.section, { textAlign: 'center' }]}>{title}</Text>
          {message ? <Text style={[T.secondary, { textAlign: 'center' }]}>{message}</Text> : null}
          <View style={{ gap: 10, alignSelf: 'stretch', marginTop: 8 }}>
            {destructive ? (
              <Touch label={confirmLabel} onPress={onConfirm} />
            ) : (
              <PrimaryButton title={confirmLabel} onPress={onConfirm} />
            )}
            <SecondaryButton title={cancelLabel} onPress={onCancel} />
          </View>
        </Animated.View>
      </Column>
    </Modal>
  );
}

function Touch({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.dangerBtn, pressed && { opacity: 0.85 }]}
      accessibilityRole="button">
      <Text style={[T.button, { color: C.onPrimary }]}>{label}</Text>
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
            <Ionicons
              name={toast.tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={toast.tone === 'success' ? C.accentOnPrimary : C.dangerBorder}
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
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: C.overlay },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.borderStrong,
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, paddingBottom: 14 },
  dialog: {
    backgroundColor: C.surface,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  dialogIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dangerBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    maxWidth: APP_MAX_WIDTH - 40,
  },
  toastText: { fontFamily: F.medium, fontSize: 14, color: C.onPrimary, flexShrink: 1 },
});
