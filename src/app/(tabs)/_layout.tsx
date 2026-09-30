import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassBarBackground } from '@/components/glass-bar';
import type { IconName } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { F, TAB_BAR_HEIGHT, tabBarGap } from '@/lib/theme';
import { makeStyles, useTheme } from '@/lib/theme-context';

/** Outline icon when idle, filled burgundy icon when active. */
function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={23} color={color} />;
  };
}

/** Three-person group glyph for Customers. */
function CustomersIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name={focused ? 'account-group' : 'account-group-outline'}
      size={25}
      color={color as string}
    />
  );
}

/** Rounded cog for Settings. */
function SettingsIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  return <MaterialCommunityIcons name={focused ? 'cog' : 'cog-outline'} size={24} color={color as string} />;
}

/** Calendar uses the dotted month-grid glyph, filled when active. */
function CalendarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name={focused ? 'calendar-month' : 'calendar-month-outline'}
      size={24}
      color={color as string}
    />
  );
}

/** Label with a short blue underline marking the active tab. */
function TabLabel({ focused, color, children }: { focused: boolean; color: ColorValue; children: string }) {
  const st = useSt();
  return (
    <View style={st.labelWrap}>
      <Text style={[st.label, { color }, focused && { fontFamily: F.semibold }]}>{children}</Text>
      <View style={[st.underline, focused && st.underlineOn]} />
    </View>
  );
}

/** Home is listed third so it sits mid-bar, but it stays the tab the app opens on and returns to. */
export const unstable_settings = { initialRouteName: 'index' };

export default function TabsLayout() {
  const { signedIn } = useStore();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const st = useSt();
  if (!signedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.glass.tabActive,
        tabBarInactiveTintColor: t.glass.tabIdle,
        tabBarLabel: TabLabel,
        tabBarStyle: [st.bar, { bottom: tabBarGap(insets.bottom) }],
        tabBarBackground: () => <GlassBarBackground radius={BAR_RADIUS} />,
        tabBarItemStyle: st.item,
        tabBarIconStyle: st.icon,
        tabBarActiveBackgroundColor: t.glass.tabActiveBg,
        sceneStyle: { backgroundColor: t.background },
        animation: 'shift',
      }}>
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarIcon: CalendarIcon }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Bookings', tabBarIcon: tabIcon('document-text-outline', 'document-text') }}
      />
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen
        name="customers"
        options={{ title: 'Customers', tabBarIcon: CustomersIcon }}
      />
      <Tabs.Screen name="more" options={{ title: 'Settings', tabBarIcon: SettingsIcon }} />
    </Tabs>
  );
}

const BAR_RADIUS = 22;
/** Glass tab bar: muted blue active tab on a faint blue pill, slate idle tabs (colours from `t.glass`). */
const useSt = makeStyles((t) => StyleSheet.create({
  /**
   * Floating glass capsule over the scrolling content; the active tab gets a pale blue pill with a short
   * navy bar under its label. Tab screens pad their scroll end with `tabBarClearance`.
   */
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    marginHorizontal: 13,
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: BAR_RADIUS,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    shadowColor: t.dark ? '#000000' : '#1E1E1E',
    shadowOpacity: t.dark ? 0.35 : 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  item: {
    borderRadius: 17,
    marginHorizontal: 2,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: { marginBottom: 0 },
  labelWrap: { alignItems: 'center', marginTop: 2 },
  label: { fontFamily: F.medium, fontSize: 11, lineHeight: 14 },
  underline: { width: 26, height: 3, borderRadius: 2, marginTop: 5, backgroundColor: 'transparent' },
  underlineOn: { backgroundColor: t.glass.tabActive },
}));
