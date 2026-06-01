import AsyncStorage from '@react-native-async-storage/async-storage';

export type CachedValue<T> = {
  savedAt: string;
  value: T;
};

export async function loadCachedValue<T>(key: string) {
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as CachedValue<T>;
  } catch {
    return null;
  }
}

export async function saveCachedValue<T>(key: string, value: T) {
  const cachedValue: CachedValue<T> = {
    savedAt: new Date().toISOString(),
    value,
  };

  await AsyncStorage.setItem(key, JSON.stringify(cachedValue));
}

export async function removeCachedValue(key: string) {
  await AsyncStorage.removeItem(key);
}
