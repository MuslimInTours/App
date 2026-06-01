import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeMode } from '../theme/ThemeProvider';

const themeModeStorageKey = 'muslimin:theme-mode:v1';

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'auto' || value === 'day' || value === 'night';

export async function loadThemeMode(): Promise<ThemeMode> {
  const value = await AsyncStorage.getItem(themeModeStorageKey);
  return isThemeMode(value) ? value : 'night';
}

export async function saveThemeMode(mode: ThemeMode) {
  await AsyncStorage.setItem(themeModeStorageKey, mode);
}
