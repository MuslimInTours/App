import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { loadThemeMode, saveThemeMode } from '../services/themePreferences';
import { ResolvedTheme, setResolvedTheme } from './colors';

export type ThemeMode = 'auto' | 'day' | 'night';

type ThemeContextValue = {
  mode: ThemeMode;
  revision: number;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'night',
  revision: 0,
  resolvedTheme: 'night',
  setMode: () => undefined,
});

const daylightWindowsByMonth = [
  { end: 18, start: 8 },
  { end: 18, start: 7 },
  { end: 19, start: 7 },
  { end: 20, start: 6 },
  { end: 21, start: 6 },
  { end: 22, start: 5 },
  { end: 22, start: 5 },
  { end: 21, start: 6 },
  { end: 20, start: 7 },
  { end: 19, start: 7 },
  { end: 18, start: 8 },
  { end: 17, start: 8 },
];

const getAutoResolvedTheme = (date = new Date()): ResolvedTheme => {
  const daylightWindow = daylightWindowsByMonth[date.getMonth()];
  const hour = date.getHours();
  return hour >= daylightWindow.start && hour < daylightWindow.end ? 'day' : 'night';
};

const getResolvedTheme = (mode: ThemeMode, date = new Date()): ResolvedTheme =>
  mode === 'auto' ? getAutoResolvedTheme(date) : mode;

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('night');
  const [now, setNow] = useState(() => new Date());

  const resolvedTheme = getResolvedTheme(mode, now);
  setResolvedTheme(resolvedTheme);

  useEffect(() => {
    let isMounted = true;

    loadThemeMode().then((storedMode) => {
      if (isMounted) {
        setModeState(storedMode);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'auto') {
      return undefined;
    }

    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    saveThemeMode(nextMode).catch(() => undefined);
  };

  const value = useMemo(
    () => ({
      mode,
      revision: resolvedTheme === 'day' ? 1 : 0,
      resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings() {
  return useContext(ThemeContext);
}

export function useThemedStyles<T>(createStyles: () => T) {
  const { revision } = useThemeSettings();
  return useMemo(createStyles, [createStyles, revision]);
}
