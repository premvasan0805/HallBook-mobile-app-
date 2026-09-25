import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { C, F } from '@/lib/theme';

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

/** Label with a short burgundy underline marking the active tab. */
function TabLabel({ focused, color, children }: { focused: boolean; color: ColorValue; children: string }) {
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
  if (!signedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.text,
        tabBarLabel: TabLabel,
        tabBarStyle: [st.bar, { marginBottom: Math.max(insets.bottom, 10) }],
        tabBarItemStyle: st.item,
        tabBarIconStyle: st.icon,
        tabBarActiveBackgroundColor: C.primarySoft,
        sceneStyle: { backgroundColor: C.bg },
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

const st = StyleSheet.create({
  /** Floating rounded bar; the active tab gets a soft blush pill with a short burgundy bar under its label. */
  bar: {
    height: 72,
    marginHorizontal: 13,
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderTopWidth: 0,
    shadowColor: '#57152C',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  item: {
    borderRadius: 12,
    marginHorizontal: 2,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: { marginBottom: 0 },
  labelWrap: { alignItems: 'center', marginTop: 2 },
  label: { fontFamily: F.medium, fontSize: 11, lineHeight: 14 },
  underline: { width: 24, height: 3, borderRadius: 2, marginTop: 5, backgroundColor: 'transparent' },
  underlineOn: { backgroundColor: C.primary },
});
