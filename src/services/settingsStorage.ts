import AsyncStorage from '@react-native-async-storage/async-storage';

const settingsStorageKey = 'muslimin:settings:v1';

export type StoredSettings = Record<string, boolean>;

export async function loadStoredSettings() {
  const value = await AsyncStorage.getItem(settingsStorageKey);
  return value ? (JSON.parse(value) as StoredSettings) : {};
}

export async function saveStoredSettings(settings: StoredSettings) {
  await AsyncStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}
