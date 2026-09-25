import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText, TSpan } from 'react-native-svg';

import { BrandGradient } from '@/components/decor';
import { useToast } from '@/components/overlays';
import { Touchable } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { appWidth, C, F, noOutline } from '@/lib/theme';

/** Welcome + sign in. UI only: any 10-digit number and 4-digit PIN signs in locally, nothing leaves the device. */
export default function LoginScreen() {
  const { setSignedIn } = useStore();
  const [stage, setStage] = useState<'welcome' | 'form'>('welcome');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = phone.replace(/\D/g, '').length === 10 && /^\d{4}$/.test(pin);

  if (stage === 'welcome') {
    return <Welcome onStart={() => setStage('form')} />;
  }

  return (
    <SignInForm
      phone={phone}
      pin={pin}
      onPhone={setPhone}
      onPin={setPin}
      valid={valid}
      loading={loading}
      onBack={() => setStage('welcome')}
      onSubmit={() => {
        setLoading(true);
        setTimeout(() => {
          setSignedIn(true);
          router.replace('/');
        }, 400);
      }}
    />
  );
}

/** Arch, emblem, dividers, corner mandala and florals of the sign-in page, with the live parts removed. */
const SIGNIN_BG = require('../../assets/images/welcome/signin-bg.jpg');

/** The sign-in page is laid out on an 853×1844 reference; `u(px)` maps a reference pixel to dp. */
const SREF_W = 853;
const SREF_H = 1844;
const S_WINE = '#620A20';
const S_CREAM = '#FBF7F2';

function SignInForm({
  phone,
  pin,
  onPhone,
  onPin,
  valid,
  loading,
  onBack,
  onSubmit,
}: {
  phone: string;
  pin: string;
  onPhone: (v: string) => void;
  onPin: (v: string) => void;
  valid: boolean;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  // Scale to the scroll area's own width (a web scrollbar can make it narrower than the window).
  const [measured, setMeasured] = useState(0);
  const k = (measured || appWidth(width)) / SREF_W;
  const u = (px: number) => px * k;
  const line = (b: number, fs: number, top = serifTop) => ({ top: u(top(b, fs)), fontSize: u(fs), lineHeight: u(fs * 1.2) });
  const back = u(84);

  const field = (
    top: number,
    icon: 'call-outline' | 'lock-closed',
    input: ReactNode,
  ) => (
    <View style={[st.sField, { top: u(top), left: u(62), width: u(730), height: u(107), borderRadius: u(22) }]}>
      <View style={[st.sIcon, { left: u(83 - 62), width: u(72), height: u(72), borderRadius: u(36) }]}>
        <Ionicons name={icon} size={u(icon === 'lock-closed' ? 36 : 38)} color="#6E0F24" />
      </View>
      <View style={{ position: 'absolute', left: u(185 - 62), right: u(24), top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center' }}>
        {input}
      </View>
    </View>
  );
  const inputText = { fontFamily: F.regular, fontSize: u(34), color: C.text, padding: 0 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: S_CREAM }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}>
        <View style={{ width: u(SREF_W), height: u(SREF_H) }}>
          <Image source={SIGNIN_BG} contentFit="fill" style={StyleSheet.absoluteFill} />

          <Touchable
            onPress={onBack}
            accessibilityLabel="Back"
            style={[
              st.sBack,
              { left: u(78) - back / 2, top: Math.max(u(92) - back / 2, insets.top + 4), width: back, height: back, borderRadius: back / 2 },
            ]}>
            <Ionicons name="arrow-back" size={u(46)} color="#FFFFFF" />
          </Touchable>

          {/* Wordmark: wine "Hall", gold-foil "Book" */}
          <Animated.View entering={FadeIn.duration(400)} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${SREF_W} ${SREF_H}`}>
              <Defs>
                <LinearGradient id="sBook" x1="0" y1="443" x2="0" y2="508" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#DDB065" />
                  <Stop offset="0.55" stopColor="#C99A50" />
                  <Stop offset="1" stopColor="#A97A3C" />
                </LinearGradient>
              </Defs>
              <SvgText x={426} y={508} textAnchor="middle" fontFamily={F.pageSerifBold} fontSize={89} letterSpacing={-2}>
                <TSpan fill="#5E0A1F">Hall</TSpan>
                <TSpan fill="url(#sBook)">Book</TSpan>
              </SvgText>
            </Svg>
            <Text style={[st.sCenter, line(684, 81), { fontFamily: F.pageSerifBold, color: S_WINE, letterSpacing: -u(1) }]}>
              Welcome back
            </Text>
            <Text style={[st.sCenter, line(740, 34.4, sansTop), { fontFamily: F.regular, color: '#403A3D' }]}>
              Sign in to manage your hall.
            </Text>
          </Animated.View>

          <Text style={[st.sLabel, line(835, 31.4), { left: u(62) }]}>Mobile number</Text>
          {field(
            858,
            'call-outline',
            <>
              <Text style={[inputText, { color: phone ? C.text : '#857E84', marginRight: u(10) }]}>+91</Text>
              <TextInput
                value={phone}
                onChangeText={onPhone}
                keyboardType="phone-pad"
                placeholder="10-digit number"
                placeholderTextColor="#857E84"
                maxLength={10}
                accessibilityLabel="Mobile number"
                style={[inputText, noOutline, { flex: 1 }]}
              />
            </>,
          )}

          <Text style={[st.sLabel, line(1034, 31.4), { left: u(62) }]}>PIN</Text>
          {field(
            1058,
            'lock-closed',
            <TextInput
              value={pin}
              onChangeText={onPin}
              secureTextEntry
              keyboardType="number-pad"
              placeholder="4-digit PIN"
              placeholderTextColor="#857E84"
              maxLength={4}
              accessibilityLabel="PIN"
              style={[inputText, noOutline, { flex: 1 }]}
            />,
          )}

          <Touchable
            // Stays solid like the design; an incomplete form explains itself instead of greying out.
            onPress={() => (valid ? onSubmit() : toast('Enter your 10-digit mobile number and 4-digit PIN'))}
            disabled={loading}
            accessibilityRole="button"
            style={[
              st.sButton,
              { left: u(64), top: u(1451), width: u(726), height: u(105), borderRadius: u(22), gap: u(26), borderWidth: Math.max(u(2.5), 1) },
            ]}>
            <BrandGradient id="signInGrad" from="#6A1127" to="#7E1B30" />
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={{ fontFamily: F.pageSerif, fontSize: u(50), lineHeight: u(60), color: '#FFFFFF' }}>Sign in</Text>
                <Ionicons name="arrow-forward" size={u(48)} color="#FFFFFF" />
              </>
            )}
          </Touchable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Burgundy welcome art: mandalas, gold curves, emblem and dividers, with the live text removed. */
const WELCOME_BG = require('../../assets/images/welcome/welcome-bg.jpg');

/** The welcome screen is laid out on an 878×1790 reference; `u(px)` maps a reference pixel to dp. */
const WREF_W = 878;
const WREF_H = 1790;
const W_BG = '#4B051B';
const W_INK = '#4A0515';

/** Box top that puts a PT Serif line of size `fs` (line height 1.2·fs) on baseline `b`. */
const serifTop = (b: number, fs: number) => b - 0.9765 * fs;
/** Same for Inter. */
const sansTop = (b: number, fs: number) => b - 0.963 * fs;

function Welcome({ onStart }: { onStart: () => void }) {
  const { width, height } = useWindowDimensions();
  const w = appWidth(width);
  // Fit the whole artboard on screen; any spare room is filled with the backdrop colour.
  const k = Math.min(w / WREF_W, height / WREF_H);
  const u = (px: number) => px * k;
  const line = (b: number, fs: number) => ({ top: u(serifTop(b, fs)), fontSize: u(fs), lineHeight: u(fs * 1.2) });

  return (
    <View style={st.welcome}>
      <StatusBar style="light" />
      <View style={{ width: u(WREF_W), height: u(WREF_H) }}>
        <Image source={WELCOME_BG} contentFit="fill" style={StyleSheet.absoluteFill} />

        {/* Wordmark: ivory "Hall", gold-foil "Book" */}
        <Animated.View entering={FadeIn.duration(500)} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${WREF_W} ${WREF_H}`}>
            <Defs>
              <LinearGradient id="wHall" x1="0" y1="557" x2="0" y2="655" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FFFBF3" />
                <Stop offset="1" stopColor="#F5E4C8" />
              </LinearGradient>
              <LinearGradient id="wBook" x1="0" y1="557" x2="0" y2="655" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FCDD94" />
                <Stop offset="0.6" stopColor="#EBC57E" />
                <Stop offset="1" stopColor="#D09A4C" />
              </LinearGradient>
            </Defs>
            <SvgText x={450} y={655} textAnchor="middle" fontFamily={F.pageSerifBold} fontSize={133} letterSpacing={-3}>
              <TSpan fill="url(#wHall)">Hall</TSpan>
              <TSpan fill="url(#wBook)">Book</TSpan>
            </SvgText>
          </Svg>
          <Text style={[st.wText, line(729, 41.5), { color: '#FFFFFF' }]}>Make every celebration memorable</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Text style={[st.wText, line(1401, 31.5), { lineHeight: u(44), color: '#F8F1EA' }]}>
            Bookings, payments and important dates for your{'\n'}marriage hall — in one place.
          </Text>
          <Touchable
            onPress={onStart}
            accessibilityRole="button"
            style={[
              st.wButton,
              { left: u(58), top: u(1495), width: u(762), height: u(114), borderRadius: u(30), gap: u(28), borderWidth: Math.max(u(2.5), 1) },
            ]}>
            <Text style={{ fontFamily: F.pageSerifBold, fontSize: u(48), lineHeight: u(58), color: W_INK }}>Get Started</Text>
            <Ionicons name="arrow-forward" size={u(46)} color={W_INK} />
          </Touchable>
          <Text style={[st.wText, line(1669, 28.5), { color: '#D4AA75', letterSpacing: u(0.5) }]}>
            Manage your wedding hall with ease
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  welcome: { flex: 1, backgroundColor: W_BG, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sCenter: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  sLabel: { position: 'absolute', fontFamily: F.pageSerifBold, color: '#1E1A1C' },
  sField: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#E7DDD4',
    backgroundColor: '#FFFDFB',
    justifyContent: 'center',
  },
  sIcon: { position: 'absolute', backgroundColor: '#F7E4E8', alignItems: 'center', justifyContent: 'center' },
  sBack: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.16)', alignItems: 'center', justifyContent: 'center' },
  sButton: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderColor: '#D9A45E',
    boxShadow: '0px 6px 14px rgba(87, 21, 44, 0.28)',
  },
  wText: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: F.pageSerif },
  wButton: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCF4E9',
    borderColor: '#DDB277',
    boxShadow: '0px 6px 16px rgba(20, 0, 6, 0.35)',
  },
});
