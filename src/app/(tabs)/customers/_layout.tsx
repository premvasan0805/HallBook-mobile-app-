import { Stack } from 'expo-router/stack';

import { useTheme } from '@/lib/theme-context';

/** Customers tab: the list, with profiles pushed on top so the tab bar stays visible. */
export default function CustomersLayout() {
  const { C } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}
    />
  );
}
