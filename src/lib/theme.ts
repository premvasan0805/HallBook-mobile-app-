import { Platform, StyleSheet, type TextStyle } from 'react-native';

/**
 * HallBook design tokens. Burgundy = brand/action, gold = subtle premium accent, warm ivory = app background.
 * Semantic tones (success/warning/danger/info) are for payments, alerts and toasts.
 * Slot availability uses `S`, important-date categories use `D` — never mix the three.
 */
export const C = {
  primary: '#7A1F3D',
  primaryDark: '#57152C',
  primarySoft: '#F6EAEE',
  primaryMuted: '#C49AA9',
  /** Stronger blush for avatars and "unpaid" pills. */
  primaryTint: '#F6DFE5',
  /** Subtle burgundy sheen for hero surfaces and the main call-to-action. */
  gradientFrom: '#731634',
  gradientTo: '#8C2548',
  onPrimary: '#FFFFFF',
  /** Secondary text / icons sitting on a burgundy surface. */
  onPrimarySoft: '#F1DCE3',
  onPrimaryMuted: '#D6AFBD',

  accent: '#B8893C',
  accentSoft: '#F6EEDF',
  /** Gold dark enough for text on white/ivory (AA). */
  accentText: '#83602A',
  /** Gold for icons/text on burgundy. */
  accentOnPrimary: '#E6C68A',

  bg: '#FAF7F2',
  /** Backdrop around the phone column on web. */
  bgBackdrop: '#DCE6F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EEE7',
  border: '#E8DFD8',
  borderStrong: '#D9CCC2',

  text: '#241F21',
  textSecondary: '#756D70',
  textMuted: '#A0979A',

  success: '#2E7D4F',
  successSoft: '#E7F2EA',
  warning: '#B07516',
  warningSoft: '#FAF0DC',
  danger: '#B3262F',
  dangerSoft: '#FBE9EA',
  dangerBorder: '#EBB8BC',
  info: '#3E6A9E',
  infoSoft: '#E8EEF6',

  overlay: 'rgba(36, 31, 33, 0.45)',
};

/** Blue glass palette for the glass screens and every popup. */
export const G = {
  ink: '#131D38',
  navy: '#1F3A70',
  blue: '#2F63C0',
  deep: '#1F3F92',
  muted: '#5B6275',
  placeholder: '#8A90A2',
  /** Gradient for glossy blue buttons and selected pills. */
  gradFrom: '#4F86E6',
  gradTo: '#1C48B0',
  soft: 'rgba(47, 99, 192, 0.08)',
  rule: 'rgba(31, 58, 112, 0.16)',
  /** Selected outline + glow around a glass control. */
  focusBorder: 'rgba(79, 134, 230, 0.85)',
  focusGlow:
    'inset 0px 1px 0px rgba(255, 255, 255, 1), 0px 0px 0px 1px rgba(79, 134, 230, 0.2), 0px 0px 10px rgba(79, 134, 230, 0.35)',
  /** Glow under glossy blue buttons and pills. */
  buttonGlow:
    'inset 0px 1px 0px rgba(255, 255, 255, 0.5), 0px 0px 0px 1px rgba(95, 140, 220, 0.35), 0px 0px 12px rgba(70, 125, 230, 0.45), 0px 6px 14px rgba(28, 72, 176, 0.25)',
  overlay: 'rgba(19, 29, 56, 0.42)',
};

/** Booking-slot availability. Only for communicating whether a slot can be booked. */
export const S = {
  vacant: '#2E8B57',
  vacantSoft: '#E5F3EB',
  booked: '#C83C4A',
  bookedSoft: '#FBE8EA',
  /** Some slots booked, others still open (single-dot day summary). */
  partial: '#E39AA2',
  tentative: '#D99A2B',
  tentativeSoft: '#FBF1DE',
  tentativeText: '#9A6A12',
  blocked: '#7B8088',
  blockedSoft: '#EEEFF1',
};

/** Important-date categories (Tamil calendar). Chosen to stay distinct from the `S` availability colours. */
export const D = {
  muhurtham: { fg: '#8A6424', bg: '#F5ECDB' },
  valarpirai: { fg: '#6A4FA0', bg: '#EFEAF7' },
  theipirai: { fg: '#4A6A8C', bg: '#E7EEF5' },
  special: { fg: '#2A7682', bg: '#E1F0F2' },
  holiday: { fg: '#A8354F', bg: '#FAE6EB' },
};

/** Phone column width used on web so the app never renders as a desktop page. */
export const APP_MAX_WIDTH = 430;
/** Web viewports narrower than this (phones, narrow windows) fill the screen instead of showing the phone column. */
const FULL_WIDTH_BELOW = 600;

/** Width the app actually renders at for a given window width. */
export function appWidth(windowWidth: number) {
  if (Platform.OS !== 'web' || windowWidth < FULL_WIDTH_BELOW) return windowWidth;
  return Math.min(windowWidth, APP_MAX_WIDTH);
}

/**
 * Removes the browser focus ring from web text inputs — the field border already shows focus.
 * Chrome ignores `outlineWidth: 0` while the default `outline-style: auto` applies, and RN types lack `'none'`.
 */
export const noOutline: TextStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {};

/** Floating tab bar height. The bar overlays content, so tab screens pad their scroll end by `tabBarClearance`. */
export const TAB_BAR_HEIGHT = 66;

/** Bottom gap under the floating tab bar for a given safe-area inset. */
export function tabBarGap(insetBottom: number) {
  return Math.max(insetBottom, 14);
}

/** Scroll padding that keeps a tab screen's last item clear of the floating glass tab bar. */
export function tabBarClearance(insetBottom: number) {
  return TAB_BAR_HEIGHT + tabBarGap(insetBottom) + 12;
}

/**
 * Tab bar glass. The backdrop behind the bar is pale (ivory page, white cards), so it uses dark ink
 * on white frost. Light comes from the top: bright top rim, dimmer sides and bottom.
 */
export const glass = {
  /** Frost fill where the backdrop is blurred (web). */
  fill: 'rgba(255, 252, 248, 0.64)',
  /** Near-solid fill where no blur is available (Android, reduced transparency). */
  fillSolid: 'rgba(255, 253, 250, 0.97)',
  rimTop: 'rgba(255, 255, 255, 0.95)',
  rim: 'rgba(255, 255, 255, 0.55)',
  rimBottom: 'rgba(31, 58, 112, 0.10)',
  /** Web backdrop filter for the frosted tier. */
  backdrop: 'blur(22px) saturate(1.6) brightness(1.04)',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** Rounded humanist sans for glass call-to-action labels. */
  latoBold: 'Lato_700Bold',
  /** Display serif — used sparingly for brand taglines. */
  serif: 'CormorantGaramond_500Medium',
  serifSemibold: 'CormorantGaramond_600SemiBold',
  serifBold: 'CormorantGaramond_700Bold',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  /** Text serif for page-header titles. */
  pageSerif: 'PTSerif_400Regular',
  pageSerifBold: 'PTSerif_700Bold',
};

export const T = StyleSheet.create({
  screenTitle: { fontFamily: F.semibold, fontSize: 25, lineHeight: 32, color: C.text, letterSpacing: -0.3 },
  section: { fontFamily: F.semibold, fontSize: 18, lineHeight: 24, color: C.text },
  cardTitle: { fontFamily: F.semibold, fontSize: 16, lineHeight: 22, color: C.text },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.text },
  bodyMedium: { fontFamily: F.medium, fontSize: 15, lineHeight: 21, color: C.text },
  secondary: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.textSecondary },
  caption: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.textSecondary },
  overline: {
    fontFamily: F.semibold,
    fontSize: 11.5,
    lineHeight: 16,
    color: C.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  amount: { fontFamily: F.bold, fontSize: 20, lineHeight: 26, color: C.text, letterSpacing: -0.2 },
  amountSm: { fontFamily: F.semibold, fontSize: 16, lineHeight: 22, color: C.text },
  button: { fontFamily: F.semibold, fontSize: 15.5, lineHeight: 20 },
});

/** One soft elevation used everywhere — no heavy shadows. */
export const elevation = {
  shadowColor: '#57152C',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};
