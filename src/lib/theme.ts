import { Platform, StyleSheet, type TextStyle } from 'react-native';

/**
 * Banyan Meadows design tokens.
 *
 * Two complete themes — `LightTheme` and `DarkTheme` — share one shape (`Theme`). Screens never import colours
 * directly: they read the active theme with `useTheme()` / `makeStyles()` from `@/lib/theme-context`.
 *
 * - Top-level semantic tokens (`background`, `surface`, `glassSurface`, `primary`, …) are the public vocabulary.
 * - `C` = app palette (brand/action, text, borders, semantic tones), `G` = glass-screen palette,
 *   `S` = slot availability, `D` = important-date categories, `tone` = gradient tiles. Never mix S, D and C.
 * - Banyan Meadows look: iOS-style frosted glass over a softly blurred venue photo. Neutral glass carries ~70% of
 *   the screen, the warm environment ~20% and the brand gold (#C69224 / #D6AA45) is a ~10% accent.
 */

type ToneName = 'blue' | 'sand' | 'mint' | 'rose' | 'violet' | 'peach' | 'slate';
/** Soft gradient tile: `from`→`to` body, `fg` icon/text colour, `glow` faint halo (transparent in dark). */
export type Tone = { from: string; to: string; fg: string; glow: string };

/** Banyan Meadows brand golds. Gold is an accent (~10% of the screen) — never a page or card fill. */
export const BRAND = {
  gold: '#C69224',
  goldSecondary: '#D6AA45',
  goldLight: '#E8D29A',
  ivory: '#FAF8F3',
};

const LIGHT_C = {
  primary: '#C69224',
  primaryDark: '#A87A1A',
  primarySoft: '#F7EFDC',
  primaryMuted: '#E8D29A',
  /** Stronger tint for avatars and selected chips. */
  primaryTint: '#F1E4C4',
  /** Gentle sheen for hero surfaces and the main call-to-action. */
  gradientFrom: '#D6AA45',
  gradientTo: '#C69224',
  onPrimary: '#FFFFFF',
  /** Secondary text / icons sitting on a gold surface. */
  onPrimarySoft: '#FFF6E2',
  onPrimaryMuted: '#F6E6BF',

  accent: '#C69224',
  accentSoft: '#F8F0DE',
  /** Gold dark enough for text on light surfaces (AA). */
  accentText: '#8A6418',
  /** Pale gold for icons/text on a gold surface. */
  accentOnPrimary: '#FFF4DA',

  bg: '#FAF8F3',
  /** Backdrop around the phone column on web. */
  bgBackdrop: '#ECE6DA',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EFE6',
  border: '#E9E3D6',
  borderStrong: '#D8D0BF',

  text: '#252525',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  success: '#3F8F6B',
  successSoft: '#E6F2EA',
  warning: '#B7832F',
  warningSoft: '#FAF1DE',
  danger: '#C2545A',
  dangerSoft: '#FBEBEC',
  dangerBorder: '#EFC3C5',
  info: '#A87A1A',
  infoSoft: '#F7EFDC',

  overlay: 'rgba(37, 30, 20, 0.34)',
};

const DARK_C: typeof LIGHT_C = {
  primary: '#D6AA45',
  primaryDark: '#C69224',
  primarySoft: '#2A2415',
  primaryMuted: '#6B5526',
  primaryTint: '#332A18',
  gradientFrom: '#D6AA45',
  gradientTo: '#B4862A',
  onPrimary: '#FFFFFF',
  onPrimarySoft: '#FFF4DA',
  onPrimaryMuted: '#EBD6A6',

  accent: '#D6AA45',
  accentSoft: '#2A2415',
  accentText: '#E2BE6A',
  accentOnPrimary: '#FFF4DA',

  bg: '#0E0D0B',
  bgBackdrop: '#080706',
  surface: '#1A1814',
  surfaceAlt: '#221F1A',
  border: '#2E2A24',
  borderStrong: '#3B362E',

  text: '#F5F2EA',
  textSecondary: '#A8A29A',
  textMuted: '#7A746B',

  success: '#6FC39A',
  successSoft: '#13251C',
  warning: '#E0B460',
  warningSoft: '#2B2415',
  danger: '#E88A8A',
  dangerSoft: '#2E1A1A',
  dangerBorder: '#5A2E2E',
  info: '#D6AA45',
  infoSoft: '#2A2415',

  overlay: 'rgba(0, 0, 0, 0.6)',
};

/**
 * Glass-screen palette (key names are historical). `ink` is the main text colour on glass, `blue` the gold
 * accent, `navy` icons/secondary headings (warm charcoal), `grad*` the gold used for selected pills.
 */
const LIGHT_G = {
  ink: '#252525',
  navy: '#57514A',
  blue: '#C69224',
  deep: '#A87A1A',
  muted: '#6B7280',
  placeholder: '#9CA3AF',
  /** Text/icons on a gold button. */
  onBlue: '#FFFFFF',
  /** Gradient for gold buttons and selected pills — warm, never brassy. */
  gradFrom: '#DDB85E',
  gradTo: '#C69224',
  soft: 'rgba(198, 146, 36, 0.10)',
  rule: 'rgba(37, 37, 37, 0.10)',
  /** Selected outline + soft ring around a glass control. */
  focusBorder: 'rgba(198, 146, 36, 0.55)',
  focusGlow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.9), 0px 0px 0px 3px rgba(198, 146, 36, 0.14)',
  /** Border + shadow under gold buttons and pills. */
  buttonBorder: 'rgba(255, 255, 255, 0.65)',
  buttonGlow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.5), 0px 6px 18px rgba(198, 146, 36, 0.20)',
  overlay: 'rgba(37, 30, 20, 0.30)',
};

const DARK_G: typeof LIGHT_G = {
  ink: '#F5F2EA',
  navy: '#CFC7BA',
  blue: '#D6AA45',
  deep: '#E2BE6A',
  muted: '#A8A29A',
  placeholder: '#7A746B',
  onBlue: '#FFFFFF',
  gradFrom: '#C99E40',
  gradTo: '#9C7424',
  soft: 'rgba(214, 170, 69, 0.12)',
  rule: 'rgba(255, 255, 255, 0.10)',
  focusBorder: 'rgba(214, 170, 69, 0.55)',
  focusGlow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.08), 0px 0px 0px 3px rgba(214, 170, 69, 0.18)',
  buttonBorder: 'rgba(255, 255, 255, 0.20)',
  buttonGlow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.18), 0px 6px 18px rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.55)',
};

/** Booking-slot availability. Only for communicating whether a slot can be booked. */
const LIGHT_S = {
  vacant: '#3F9A6E',
  vacantSoft: '#E6F4EE',
  booked: '#D0616A',
  bookedSoft: '#FBEBEC',
  /** Some slots booked, others still open (single-dot day summary). */
  partial: '#E6A3AA',
  tentative: '#D9A24A',
  tentativeSoft: '#FBF3E2',
  tentativeText: '#96691C',
  blocked: '#8A8479',
  blockedSoft: '#F1EEE8',
};

const DARK_S: typeof LIGHT_S = {
  vacant: '#6FC39A',
  vacantSoft: '#13291F',
  booked: '#E88A8A',
  bookedSoft: '#2E1A1D',
  partial: '#C98D93',
  tentative: '#E0B460',
  tentativeSoft: '#2B2415',
  tentativeText: '#E6C27A',
  blocked: '#9A9388',
  blockedSoft: '#24211C',
};

/** Important-date categories (Tamil calendar). Chosen to stay distinct from the `S` availability colours. */
const LIGHT_D = {
  muhurtham: { fg: '#8A6424', bg: '#F5ECDB' },
  valarpirai: { fg: '#6A4FA0', bg: '#EFEAF7' },
  theipirai: { fg: '#5C6A78', bg: '#ECEEF0' },
  special: { fg: '#2A7682', bg: '#E1F0F2' },
  holiday: { fg: '#A8354F', bg: '#FAE6EB' },
};

const DARK_D: typeof LIGHT_D = {
  muhurtham: { fg: '#DDBB7A', bg: '#2A2418' },
  valarpirai: { fg: '#B7A2E0', bg: '#221D33' },
  theipirai: { fg: '#AEB6BF', bg: '#1E2124' },
  special: { fg: '#7CC4CE', bg: '#122A2E' },
  holiday: { fg: '#E394A6', bg: '#2E1A22' },
};

/**
 * Muted semantic tiles. `blue` is now the neutral warm-glass tile (the name is historical); `sand` is the gold
 * tile. Kept desaturated so the gold accent stays the loudest colour on screen.
 */
const LIGHT_TONE: Record<ToneName, Tone> = {
  blue: { from: '#FFFFFF', to: '#F1ECE2', fg: '#6B5A3A', glow: 'rgba(120, 100, 60, 0.12)' },
  sand: { from: '#FBF4E3', to: '#F0E0B8', fg: '#A87A1A', glow: 'rgba(198, 146, 36, 0.16)' },
  mint: { from: '#F0F7F2', to: '#D8EBDF', fg: '#3F8F6B', glow: 'rgba(63, 143, 107, 0.14)' },
  rose: { from: '#FDF3F3', to: '#F4DCDD', fg: '#C2545A', glow: 'rgba(194, 84, 90, 0.12)' },
  violet: { from: '#F6F3FB', to: '#E6DFF3', fg: '#7A62B0', glow: 'rgba(122, 98, 176, 0.12)' },
  peach: { from: '#FDF5EE', to: '#F3E0CE', fg: '#B0703F', glow: 'rgba(176, 112, 63, 0.12)' },
  slate: { from: '#F8F6F2', to: '#ECE8E0', fg: '#57514A', glow: 'rgba(87, 81, 74, 0.10)' },
};

const DARK_TONE: Record<ToneName, Tone> = {
  blue: { from: '#2A2721', to: '#1E1C18', fg: '#D8CDB8', glow: 'rgba(0, 0, 0, 0)' },
  sand: { from: '#3A301A', to: '#2A2314', fg: '#E2BE6A', glow: 'rgba(0, 0, 0, 0)' },
  mint: { from: '#1C3128', to: '#15241E', fg: '#7ACBA2', glow: 'rgba(0, 0, 0, 0)' },
  rose: { from: '#3A2124', to: '#2A181B', fg: '#E88A8A', glow: 'rgba(0, 0, 0, 0)' },
  violet: { from: '#2C2640', to: '#211D30', fg: '#BCA8E6', glow: 'rgba(0, 0, 0, 0)' },
  peach: { from: '#352A20', to: '#281F18', fg: '#E0A57A', glow: 'rgba(0, 0, 0, 0)' },
  slate: { from: '#27251F', to: '#1D1B17', fg: '#BDB4A6', glow: 'rgba(0, 0, 0, 0)' },
};

/** Floating tab bar glass. Light comes from the top: brighter top rim, dimmer sides and bottom. */
const LIGHT_GLASS = {
  /** Frost fill where the backdrop is blurred (web). */
  fill: 'rgba(255, 255, 255, 0.42)',
  /** Near-solid fill where no blur is available (Android, reduced transparency). */
  fillSolid: 'rgba(250, 248, 243, 0.94)',
  rimTop: 'rgba(255, 255, 255, 0.85)',
  rim: 'rgba(255, 255, 255, 0.65)',
  rimBottom: 'rgba(255, 255, 255, 0.4)',
  rimShadow:
    'inset 0px 1px 0px rgba(255, 255, 255, 0.45), inset 0px 0px 18px rgba(255, 255, 255, 0.12), 0px 8px 30px rgba(30, 30, 30, 0.10)',
  /** Web backdrop filter for the frosted tier. */
  backdrop: 'blur(30px) saturate(1.35)',
  /** Translucent gold capsule behind the active tab, and active/idle tab colours. */
  tabActiveBg: 'rgba(214, 170, 69, 0.16)',
  tabActive: '#B07F1C',
  tabIdle: '#4B4640',
};

const DARK_GLASS: typeof LIGHT_GLASS = {
  fill: 'rgba(255, 255, 255, 0.10)',
  fillSolid: 'rgba(26, 24, 20, 0.95)',
  rimTop: 'rgba(255, 255, 255, 0.24)',
  rim: 'rgba(255, 255, 255, 0.16)',
  rimBottom: 'rgba(255, 255, 255, 0.08)',
  rimShadow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.12), 0px 10px 30px rgba(0, 0, 0, 0.5)',
  backdrop: 'blur(30px) saturate(1.3)',
  tabActiveBg: 'rgba(214, 170, 69, 0.18)',
  tabActive: '#E2BE6A',
  tabIdle: '#BDB4A6',
};

/**
 * Glass tiers (iOS-style materials). `fill` is the pane colour, `blur` the web backdrop radius in px.
 * - primary: major cards, booking rows, nav bar, modal surfaces
 * - secondary: small metric cards, filters, selectors, secondary controls
 * - strong: bottom sheets, important modal content, confirmation panels
 */
export type GlassTier = 'primary' | 'secondary' | 'strong';
const LIGHT_TIERS: Record<GlassTier, { fill: string; blur: number }> = {
  primary: { fill: 'rgba(255, 255, 255, 0.32)', blur: 28 },
  secondary: { fill: 'rgba(255, 255, 255, 0.24)', blur: 22 },
  strong: { fill: 'rgba(255, 255, 255, 0.60)', blur: 35 },
};
const DARK_TIERS: typeof LIGHT_TIERS = {
  primary: { fill: 'rgba(255, 255, 255, 0.10)', blur: 28 },
  secondary: { fill: 'rgba(255, 255, 255, 0.08)', blur: 22 },
  strong: { fill: 'rgba(30, 27, 22, 0.78)', blur: 35 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

/**
 * One family everywhere: Inter. Weights — 400 body, 500 labels/meta, 600 headings/names/amounts/buttons,
 * 700 only for rare emphasis on money. No serif or display faces.
 */
export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

function makeType(c: typeof LIGHT_C) {
  return StyleSheet.create({
    screenTitle: { fontFamily: F.semibold, fontSize: 25, lineHeight: 30, color: c.text, letterSpacing: -0.3 },
    section: { fontFamily: F.semibold, fontSize: 19, lineHeight: 23, color: c.text, letterSpacing: -0.2 },
    cardTitle: { fontFamily: F.semibold, fontSize: 16, lineHeight: 21, color: c.text },
    body: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: c.text },
    bodyMedium: { fontFamily: F.medium, fontSize: 15, lineHeight: 21, color: c.text },
    secondary: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: c.textSecondary },
    caption: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: c.textSecondary },
    overline: {
      fontFamily: F.medium,
      fontSize: 11,
      lineHeight: 15,
      color: c.textSecondary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    amount: { fontFamily: F.semibold, fontSize: 20, lineHeight: 25, color: c.text, letterSpacing: -0.2 },
    amountSm: { fontFamily: F.semibold, fontSize: 16, lineHeight: 22, color: c.text },
    button: { fontFamily: F.semibold, fontSize: 15, lineHeight: 20 },
  });
}

function build(dark: boolean) {
  const C = dark ? DARK_C : LIGHT_C;
  const G = dark ? DARK_G : LIGHT_G;
  const clamp = (a: number) => Math.round(Math.max(0, Math.min(1, a)) * 1000) / 1000;
  return {
    dark,
    scheme: (dark ? 'dark' : 'light') as 'light' | 'dark',

    // ----- Semantic tokens -----
    background: C.bg,
    backgroundAlt: dark ? '#16140F' : '#F3EFE6',
    surface: C.surface,
    /** Default frosted card fill. */
    glassSurface: dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.32)',
    glassBorder: dark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.45)',
    /** Glass material tiers — see `GlassTier`. */
    tiers: dark ? DARK_TIERS : LIGHT_TIERS,
    primary: C.primary,
    secondary: dark ? '#E2BE6A' : '#D6AA45',
    /** Light gold hairlines and rules (name is historical). */
    lightBlue: dark ? '#6B5526' : '#E8D29A',
    veryLightBlue: dark ? '#2A2415' : '#F7EFDC',
    text: C.text,
    textSecondary: C.textSecondary,
    textMuted: C.textMuted,
    success: C.success,
    warning: C.warning,
    danger: C.danger,
    /** Drop-shadow colour for glass and cards. */
    shadow: dark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(30, 30, 30, 0.08)',
    /** Faint ambient gold glow (use sparingly). */
    glow: dark ? 'rgba(214, 170, 69, 0.10)' : 'rgba(198, 146, 36, 0.12)',
    /** Top highlight colour for sheens and light trails (white, dimmed in dark). */
    highlight: '#FFFFFF',
    /** Multiplier for sheens/reflections — glass stays matte, never glossy. */
    sheen: dark ? 0.16 : 0.45,

    /**
     * Frosted fill. Pass a nominal white alpha (0.3–0.95). Light mode compresses it into the real-glass band
     * (≈0.25–0.48) so the backdrop always shows through; dark mode maps it to a faint 0.07–0.15 white.
     */
    frost: (a: number) =>
      dark ? `rgba(255, 255, 255, ${clamp(0.07 + (a - 0.3) * 0.12)})` : `rgba(255, 255, 255, ${clamp(0.14 + a * 0.36)})`,
    /** Pale-gold frosted fill (selected rows, highlighted panes). */
    tint: (a: number) =>
      dark ? `rgba(214, 170, 69, ${clamp(0.08 + a * 0.08)})` : `rgba(250, 240, 214, ${clamp(a * 0.72)})`,

    C,
    G,
    S: dark ? DARK_S : LIGHT_S,
    D: dark ? DARK_D : LIGHT_D,
    tone: dark ? DARK_TONE : LIGHT_TONE,
    glass: dark ? DARK_GLASS : LIGHT_GLASS,
    T: makeType(C),
    /** One soft elevation used everywhere — no heavy shadows. */
    elevation: {
      shadowColor: dark ? '#000000' : '#1E1E1E',
      shadowOpacity: dark ? 0.3 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
  };
}

export type Theme = ReturnType<typeof build>;
export const LightTheme: Theme = build(false);
export const DarkTheme: Theme = build(true);

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
  return Math.max(insetBottom - 10, 4);
}

/** Scroll padding that keeps a tab screen's last item clear of the floating glass tab bar. */
export function tabBarClearance(insetBottom: number) {
  return TAB_BAR_HEIGHT + tabBarGap(insetBottom) + 12;
}
