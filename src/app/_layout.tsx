import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import { Lato_700Bold } from '@expo-google-fonts/lato';
import { PTSerif_400Regular, PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/overlays';
import { LoadingState } from '@/components/primitives';
import { StoreProvider } from '@/lib/store';
import { appWidth, C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_500Medium_Italic,
    PTSerif_400Regular,
    PTSerif_700Bold,
    Lato_700Bold,
  });
  const ready = loaded || !!error;
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          {/* On web the app is rendered inside a phone-width column — it is a mobile app, not a website. */}
          <View style={styles.outer}>
            <View style={[styles.inner, { width: appWidth(width) }]}>
              <ToastProvider>
                {ready ? (
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: C.bg },
                      animation: 'slide_from_right',
                    }}>
                    <Stack.Screen name="login" options={{ animation: 'fade' }} />
                    <Stack.Screen name="booking/new" options={{ animation: 'slide_from_bottom' }} />
                  </Stack>
                ) : (
                  <LoadingState />
                )}
              </ToastProvider>
            </View>
          </View>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? C.bgBackdrop : C.bg,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
});
