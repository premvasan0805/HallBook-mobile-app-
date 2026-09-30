import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { DarkTheme, LightTheme, type Theme } from './theme';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'hallbook.theme-mode';

type Ctx = { theme: Theme; mode: ThemeMode; setMode: (m: ThemeMode) => void; ready: boolean };

const ThemeContext = createContext<Ctx>({ theme: LightTheme, mode: 'system', setMode: () => {}, ready: true });

/** Holds the Light / Dark / System choice, persisted across restarts, and resolves it to a `Theme`. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (alive && (v === 'light' || v === 'dark' || v === 'system')) setModeState(v);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<Ctx>(() => {
    const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
    return {
      theme: dark ? DarkTheme : LightTheme,
      mode,
      ready,
      setMode: (m) => {
        setModeState(m);
        AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
      },
    };
  }, [mode, system, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Active theme tokens. */
export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

/** Light / Dark / System preference and its setter. */
export function useThemeMode() {
  const { mode, setMode, ready } = useContext(ThemeContext);
  return { mode, setMode, ready };
}

/**
 * Themed stylesheet hook. Define once at module level and call inside components:
 *
 *   const useSt = makeStyles((t) => StyleSheet.create({ title: { color: t.text } }));
 *   function X() { const st = useSt(); … }
 *
 * The factory runs once per theme and is cached, so styles stay referentially stable.
 */
export function makeStyles<S>(factory: (t: Theme) => S) {
  const cache = new Map<Theme, S>();
  return function useStyles(): S {
    const t = useTheme();
    let s = cache.get(t);
    if (!s) {
      s = factory(t);
      cache.set(t, s);
    }
    return s;
  };
}
