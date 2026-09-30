import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
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
import { appWidth } from '@/lib/theme';
import { makeStyles, ThemeProvider, useTheme, useThemeMode } from '@/lib/theme-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

function Root() {
  const t = useTheme();
  const { ready: themeReady } = useThemeMode();
  const styles = useStyles();
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // Wait for the saved Light/Dark choice too, so the first frame never flashes the wrong theme.
  const ready = (loaded || !!error) && themeReady;
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style={t.dark ? 'light' : 'dark'} />
          {/* On web the app is rendered inside a phone-width column — it is a mobile app, not a website. */}
          <View style={styles.outer}>
            <View style={[styles.inner, { width: appWidth(width) }]}>
              <ToastProvider>
                {ready ? (
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: t.background },
                      animation: 'slide_from_right',
                    }}>
                    <Stack.Screen name="login" options={{ animation: 'fade', animationDuration: 400 }} />
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

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: Platform.OS === 'web' ? t.C.bgBackdrop : t.background,
      alignItems: 'center',
    },
    inner: {
      flex: 1,
      backgroundColor: t.background,
      overflow: 'hidden',
    },
  }),
);
