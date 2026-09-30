import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, type ImageSource } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/overlays';
import { Touchable } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { easeInOut, easeOut, PRESS_MS, useEntrance, usePressScale } from '@/lib/motion';
import { appWidth, F, noOutline } from '@/lib/theme';
import { makeStyles } from '@/lib/theme-context';

/** Welcome → sign-in crossfade length. */
const TRANSITION_MS = 400;
/** Entrance travel in dp, kept small so motion supports the design rather than drawing the eye. */
const HEADING_Y = 6;
const FIELD_Y = 5;
/** Buttons grow in from this scale instead of rising. */
const BUTTON_SCALE = 0.98;

/** Welcome + sign in. UI only: any 10-digit number and 4-digit PIN signs in locally, nothing leaves the device. */
export default function LoginScreen() {
  const { setSignedIn } = useStore();
  const [stage, setStage] = useState<'welcome' | 'form'>('welcome');
  // Both screens stay mounted while one fades over the other, so the venue backdrop never drops out.
  const [crossing, setCrossing] = useState(false);
  const [intro, setIntro] = useState(true);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = phone.replace(/\D/g, '').length === 10 && /^\d{4}$/.test(pin);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (next: 'welcome' | 'form') => {
    setStage(next);
    setIntro(false);
    setCrossing(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCrossing(false), TRANSITION_MS + 60);
  };

  return (
    <View style={{ flex: 1, backgroundColor: W_BG }}>
      {(stage === 'form' || crossing) && (
        <View style={StyleSheet.absoluteFill}>
          <SignInForm
            phone={phone}
            pin={pin}
            onPhone={setPhone}
            onPin={setPin}
            valid={valid}
            loading={loading}
            onBack={() => go('welcome')}
            onSubmit={() => {
              setLoading(true);
              setTimeout(() => {
                setSignedIn(true);
                router.replace('/');
              }, 400);
            }}
          />
        </View>
      )}
      {(stage === 'welcome' || crossing) && (
        <Welcome intro={intro} leaving={stage !== 'welcome'} onStart={() => go('form')} />
      )}
    </View>
  );
}

/** Full-artboard layer that plays one entrance; children keep their artboard coordinates. */
function Enter({ children, pointerEvents = 'box-none', ...entrance }: Parameters<typeof useEntrance>[0] & {
  children: ReactNode;
  pointerEvents?: 'box-none' | 'none';
}) {
  const style = useEntrance(entrance);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}

/** A cut-out piece of the artwork, placed at its reference box `[x, y, w, h]`. */
function Piece({ source, box, u }: { source: ImageSource; box: readonly number[]; u: (px: number) => number }) {
  const [x, y, w, h] = box;
  return (
    <Image
      source={source}
      contentFit="fill"
      style={{ position: 'absolute', left: u(x), top: u(y), width: u(w), height: u(h) }}
    />
  );
}

/** Scale pivot at a reference point. */
const pivot = (u: (px: number) => number, cx: number, cy: number) => `${u(cx)}px ${u(cy)}px`;

/**
 * Sign-in art is split into a clean plate (venue backdrop, gold line florals, the glass arch card, the back-button
 * disc and the bottom divider) plus cut-outs of the banyan emblem, both field boxes and the gold button body, so
 * each can enter on its own. Stacked at rest they reproduce the original artwork exactly.
 */
const SIGNIN_PLATE = require('../../assets/images/welcome/layers/signin-plate.jpg');
const SIGNIN_PIECES = {
  logo: { source: require('../../assets/images/welcome/layers/signin-logo.png'), box: [281, 337, 319, 323] },
  phone: { source: require('../../assets/images/welcome/layers/signin-phone.png'), box: [61, 942, 758, 160] },
  pin: { source: require('../../assets/images/welcome/layers/signin-pin.png'), box: [61, 1142, 758, 160] },
  button: { source: require('../../assets/images/welcome/layers/signin-button.png'), box: [47, 1303, 787, 193] },
} as const;

/** The sign-in page is laid out on an 879×1790 reference; `u(px)` maps a reference pixel to dp. */
const SREF_W = 879;
const SREF_H = 1790;

/** Sign-in ink colours, sampled from the design. */
const S_INK = {
  tagline: '#70747A',
  title: '#171818',
  subtitle: '#6B6F76',
  label: '#151718',
  text: '#1D2126',
  placeholder: '#888B93',
  eye: '#645F5D',
};

/** Field boxes on the reference: top edge, plus the shared left/right edges and height. */
const S_FIELD = { left: 88, right: 791, height: 103 };

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
  const st = useSt();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [showPin, setShowPin] = useState(false);
  const [pressStyle, pressAnim] = usePressScale();
  // Scale to the scroll area's own width (a web scrollbar can make it narrower than the window).
  const [measured, setMeasured] = useState(0);
  const w = measured || appWidth(width);
  // Cover the screen with the artboard; overflow is trimmed evenly from the sides, which are only backdrop.
  const k = Math.max(w / SREF_W, height / SREF_H);
  const u = (px: number) => px * k;
  const line = (b: number, fs: number) => ({ top: u(sansTop(b, fs)), fontSize: u(fs), lineHeight: u(fs * 1.2) });
  const center = (b: number, fs: number, color: string, family: string = F.regular) => [
    st.sCenter,
    line(b, fs),
    { fontFamily: family, color },
  ];
  const inputText = { fontFamily: F.regular, fontSize: u(28.6), color: S_INK.text, padding: 0 };
  // Box around a live element centred on a reference point.
  const at = (cx: number, cy: number, size: number) => ({
    position: 'absolute' as const,
    left: u(cx - size / 2),
    top: u(cy - size / 2),
    width: u(size),
    height: u(size),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });

  const field = (top: number, input: ReactNode, rightEdge = S_FIELD.right - 21) => (
    <View style={{ position: 'absolute', top: u(top), left: u(237), width: u(rightEdge - 237), height: u(S_FIELD.height), flexDirection: 'row', alignItems: 'center' }}>
      {input}
    </View>
  );

  const submit = () => {
    pressAnim();
    // Stays solid like the design; an incomplete form explains itself instead of greying out.
    setTimeout(() => (valid ? onSubmit() : toast('Enter your 10-digit mobile number and 4-digit PIN')), PRESS_MS);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: W_BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}>
        <View style={{ width: w, height: u(SREF_H), overflow: 'hidden' }}>
          <View style={{ width: u(SREF_W), height: u(SREF_H), marginLeft: (w - u(SREF_W)) / 2 }}>
            {/* Already on screen when the welcome page fades off it, so the backdrop stays continuous. */}
            <Image source={SIGNIN_PLATE} contentFit="fill" style={StyleSheet.absoluteFill} />

            <Enter delay={250} duration={400}>
              <Touchable
                onPress={onBack}
                accessibilityLabel="Back"
                style={[at(92, Math.max(95, (insets.top + 4) / k + 48), 96), { borderRadius: u(48) }]}>
                <Ionicons name="arrow-back-outline" size={u(50)} color="#FFFFFF" />
              </Touchable>
            </Enter>

            <Enter delay={100} duration={550} scale={0.97} origin={pivot(u, 440, 498)} pointerEvents="none">
              <Piece {...SIGNIN_PIECES.logo} u={u} />
            </Enter>
            <Enter delay={220} duration={450} y={HEADING_Y} pointerEvents="none">
              <Text style={[center(661.7, 21.9, S_INK.tagline), { letterSpacing: u(0.1) }]}>
                A Space for Every Age, A Celebration for Every Stage
              </Text>
            </Enter>
            <Enter delay={280} duration={450} y={HEADING_Y} pointerEvents="none">
              <Text style={[center(789, 62, S_INK.title, F.semibold), { letterSpacing: -u(1.2) }]}>Welcome back</Text>
            </Enter>
            <Enter delay={340} duration={450} y={HEADING_Y} pointerEvents="none">
              <Text style={center(844.3, 27, S_INK.subtitle)}>Sign in to manage your hall.</Text>
            </Enter>

            <Enter delay={420} duration={400} y={FIELD_Y}>
              <Piece {...SIGNIN_PIECES.phone} u={u} />
              <Text style={[st.sLabel, line(946.5, 26.6), { left: u(89) }]}>Mobile number</Text>
              {field(
                970,
                <>
                  <Text style={[inputText, { color: phone ? S_INK.text : S_INK.placeholder, marginRight: u(8) }]}>+91</Text>
                  <TextInput
                    value={phone}
                    onChangeText={onPhone}
                    keyboardType="phone-pad"
                    placeholder="10-digit number"
                    placeholderTextColor={S_INK.placeholder}
                    maxLength={10}
                    accessibilityLabel="Mobile number"
                    style={[inputText, noOutline, { flex: 1 }]}
                  />
                </>,
              )}
            </Enter>

            <Enter delay={490} duration={400} y={FIELD_Y}>
              <Piece {...SIGNIN_PIECES.pin} u={u} />
              <Text style={[st.sLabel, line(1147, 26.6), { left: u(89) }]}>PIN</Text>
              {field(
                1170,
                <TextInput
                  value={pin}
                  onChangeText={onPin}
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  placeholder="4-digit PIN"
                  placeholderTextColor={S_INK.placeholder}
                  maxLength={4}
                  accessibilityLabel="PIN"
                  style={[inputText, noOutline, { flex: 1 }]}
                />,
                700,
              )}
              <Touchable
                onPress={() => setShowPin((v) => !v)}
                accessibilityLabel={showPin ? 'Hide PIN' : 'Show PIN'}
                hitSlop={8}
                style={at(739, 1221.5, 64)}>
                <Ionicons name={showPin ? 'eye-outline' : 'eye-off-outline'} size={u(44)} color={S_INK.eye} />
              </Touchable>
            </Enter>

            <Enter delay={580} duration={420} scale={BUTTON_SCALE} origin={pivot(u, 439.5, 1396)}>
              <Animated.View
                style={[StyleSheet.absoluteFill, { transformOrigin: pivot(u, 439.5, 1396) }, pressStyle]}
                pointerEvents="box-none">
                <Piece {...SIGNIN_PIECES.button} u={u} />
                <Pressable
                  onPress={submit}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                  style={{ position: 'absolute', left: u(88), top: u(1344), width: u(703), height: u(104), borderRadius: u(28) }}>
                  <View style={[StyleSheet.absoluteFill, loading && { opacity: 0.5 }]}>
                    {loading ? (
                      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    ) : (
                      <>
                        <Text
                          style={[
                            st.sButtonText,
                            { left: 0, width: u(406 - 88) * 2, top: u(sansTop(1402.3, 32.1) - 1344), fontSize: u(32.1), lineHeight: u(32.1 * 1.2) },
                          ]}>
                          Sign in
                        </Text>
                        <Ionicons
                          name="arrow-forward-outline"
                          size={u(46)}
                          color="#FFFFFF"
                          style={{ position: 'absolute', left: u(510 - 88 - 23), top: u(1394.5 - 1344 - 23) }}
                        />
                      </>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            </Enter>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Welcome art is split into a clean plate (venue backdrop, gold line florals and the feature glass card) plus
 * cut-outs of the banyan emblem, the gold divider, the three feature icons and the gold button body, so each can
 * enter on its own. Stacked at rest they reproduce the original artwork exactly.
 */
const WELCOME_PLATE = require('../../assets/images/welcome/layers/welcome-plate.jpg');
const WELCOME_PIECES = {
  logo: { source: require('../../assets/images/welcome/layers/welcome-logo.png'), box: [283, 243, 315, 323] },
  divider: { source: require('../../assets/images/welcome/layers/welcome-divider.png'), box: [271, 919, 339, 87] },
  button: { source: require('../../assets/images/welcome/layers/welcome-button.png'), box: [55, 1325, 769, 191] },
} as const;

/** The welcome screen is laid out on an 878×1790 reference; `u(px)` maps a reference pixel to dp. */
const WREF_W = 878;
const WREF_H = 1790;
/** Matches the pale edges of the welcome artwork so any spare room blends in. */
const W_BG = '#F4ECE3';

/** Welcome ink colours, sampled from the design. */
const W_INK = {
  head: '#141C23',
  gold: '#AA771F',
  tagline: '#6A696B',
  label: '#56575A',
  body: '#272A30',
  footer: '#976412',
};

/** Features: icon cut-out, centre x and label baselines on the reference. */
const W_FEATURES: { icon: ImageSource; box: number[]; cx: number; lines: string[] }[] = [
  { icon: require('../../assets/images/welcome/layers/welcome-icon1.png'), box: [129, 991, 183, 183], cx: 220.5, lines: ['Bookings'] },
  { icon: require('../../assets/images/welcome/layers/welcome-icon2.png'), box: [348, 991, 183, 183], cx: 439.5, lines: ['Payments'] },
  { icon: require('../../assets/images/welcome/layers/welcome-icon3.png'), box: [568, 991, 183, 183], cx: 659.5, lines: ['Important', 'Dates'] },
];

/** Box top that puts an Inter line of size `fs` (line height 1.2·fs) on baseline `b`. */
const sansTop = (b: number, fs: number) => b - 0.963 * fs;

/**
 * `intro` plays the full staggered opening; otherwise (coming back from sign-in) the page simply fades in.
 * `leaving` fades it out in place while the sign-in page shows through underneath.
 */
function Welcome({ intro, leaving, onStart }: { intro: boolean; leaving: boolean; onStart: () => void }) {
  const st = useSt();
  const { width, height } = useWindowDimensions();
  const w = appWidth(width);
  // Cover the screen with the artboard; overflow is trimmed evenly from the edges, which are only backdrop.
  const k = Math.max(w / WREF_W, height / WREF_H);
  const u = (px: number) => px * k;
  const line = (b: number, fs: number) => ({ top: u(sansTop(b, fs)), fontSize: u(fs), lineHeight: u(fs * 1.2) });
  const head = (b: number, color: string) => [
    st.wText,
    line(b, 73.5),
    { fontFamily: F.semibold, color, letterSpacing: -u(1.1) },
  ];
  const [pressStyle, pressAnim] = usePressScale();
  const started = useRef(false);

  // Page presence: 1 at rest, eases to 0 on leave; fades up from 0 when returning from sign-in.
  const presence = useSharedValue(intro ? 1 : 0);
  // Backdrop only fades in, then holds still.
  const plate = useSharedValue(intro ? 0 : 1);
  useEffect(() => {
    if (intro) plate.set(withTiming(1, { duration: 600, easing: easeOut }));
    else presence.set(withTiming(1, { duration: TRANSITION_MS, easing: easeInOut }));
    // Mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (leaving) presence.set(withTiming(0, { duration: TRANSITION_MS, easing: easeInOut }));
  }, [leaving, presence]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: presence.get() }));
  const plateStyle = useAnimatedStyle(() => ({ opacity: plate.get() }));

  const start = () => {
    if (started.current) return;
    started.current = true;
    pressAnim();
    setTimeout(onStart, PRESS_MS);
  };

  const play = intro;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.welcome, rootStyle]} pointerEvents={leaving ? 'none' : 'auto'}>
      <StatusBar style="dark" />
      <View style={{ width: u(WREF_W), height: u(WREF_H) }}>
        <Animated.View style={[StyleSheet.absoluteFill, plateStyle]}>
          <Image source={WELCOME_PLATE} contentFit="fill" style={StyleSheet.absoluteFill} />
        </Animated.View>

        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Enter play={play} delay={150} duration={550} scale={0.97} origin={pivot(u, 440, 404)} pointerEvents="none">
            <Piece {...WELCOME_PIECES.logo} u={u} />
          </Enter>
          <Enter play={play} delay={330} duration={450} y={HEADING_Y} pointerEvents="none">
            <Text style={[st.wText, line(584.3, 22.8), { color: W_INK.tagline, letterSpacing: u(0.1) }]}>
              A Space for Every Age, A Celebration for Every Stage
            </Text>
          </Enter>
          <Enter play={play} delay={430} duration={500} y={HEADING_Y} pointerEvents="none">
            <Text style={head(724, W_INK.head)}>Make every</Text>
            <Text style={head(805.5, W_INK.gold)}>celebration</Text>
            <Text style={head(885.5, W_INK.head)}>memorable</Text>
            <Piece {...WELCOME_PIECES.divider} u={u} />
          </Enter>

          {W_FEATURES.map((f, n) => (
            <Enter key={f.cx} play={play} delay={600 + n * 60} duration={400} y={FIELD_Y} pointerEvents="none">
              <Piece source={f.icon} box={f.box} u={u} />
              {f.lines.map((text, i) => (
                <Text
                  key={text}
                  style={[st.wLabel, line(1168.5 + i * 27, 20.8), { left: u(f.cx - 100), width: u(200), color: W_INK.label }]}>
                  {text}
                </Text>
              ))}
            </Enter>
          ))}
          <Enter play={play} delay={760} duration={450} y={FIELD_Y} pointerEvents="none">
            <Text style={[st.wText, line(1274.5, 25.5), { color: W_INK.body }]}>
              Bookings, payments and important dates for
            </Text>
            <Text style={[st.wText, line(1308, 25.5), { color: W_INK.body }]}>your marriage hall — in one place.</Text>
          </Enter>

          <Enter play={play} delay={880} duration={420} scale={BUTTON_SCALE} origin={pivot(u, 440, 1418)}>
            <Animated.View
              style={[StyleSheet.absoluteFill, { transformOrigin: pivot(u, 440, 1418) }, pressStyle]}
              pointerEvents="box-none">
              <Piece {...WELCOME_PIECES.button} u={u} />
              <Pressable
                onPress={start}
                accessibilityRole="button"
                accessibilityLabel="Get Started"
                style={[st.wButton, { left: u(94), top: u(1361), width: u(692), height: u(112), borderRadius: u(30) }]}>
                <Text
                  style={[
                    st.wButtonText,
                    { left: 0, width: u(409 - 94) * 2, top: u(sansTop(1426.8, 33.6) - 1361), fontSize: u(33.6), lineHeight: u(33.6 * 1.2) },
                  ]}>
                  Get Started
                </Text>
                <Ionicons
                  name="arrow-forward-outline"
                  size={u(44)}
                  color="#FFFFFF"
                  style={{ position: 'absolute', left: u(551.5 - 94 - 22), top: u(1417 - 1361 - 22) }}
                />
              </Pressable>
            </Animated.View>
          </Enter>
          <Enter play={play} delay={980} duration={450} pointerEvents="none">
            <Text style={[st.wText, line(1519.8, 22.2), { fontFamily: F.medium, color: W_INK.footer }]}>
              Manage your wedding hall with ease
            </Text>
          </Enter>
        </View>
      </View>
    </Animated.View>
  );
}

const useSt = makeStyles(() =>
  StyleSheet.create({
    welcome: { backgroundColor: W_BG, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    sCenter: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
    sLabel: { position: 'absolute', fontFamily: F.medium, color: S_INK.label },
    sButtonText: { position: 'absolute', textAlign: 'center', fontFamily: F.medium, color: '#FFFFFF', letterSpacing: 0.2 },
    wText: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: F.regular },
    wLabel: { position: 'absolute', textAlign: 'center', fontFamily: F.regular },
    wButton: { position: 'absolute' },
    wButtonText: { position: 'absolute', textAlign: 'center', fontFamily: F.medium, color: '#FFFFFF', letterSpacing: 0.2 },
  }),
);
