import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultMawaqitMosque, prayerTimeMosques } from '../data/mosques';

const selectedMosqueStorageKey = 'muslimin:selected-mosque:v1';
const favoriteMosqueStorageKey = 'muslimin:favorite-mosque:v1';
const visibleMosquesStorageKey = 'muslimin:visible-mosques:v1';

const allPrayerTimeMosqueIds = prayerTimeMosques.map((mosque) => mosque.id);

export async function loadSelectedMosqueId() {
  const storedMosqueId = await AsyncStorage.getItem(selectedMosqueStorageKey);

  if (storedMosqueId) {
    return storedMosqueId;
  }

  return defaultMawaqitMosque.id;
}

export async function saveSelectedMosqueId(mosqueId: string) {
  await AsyncStorage.setItem(selectedMosqueStorageKey, mosqueId);
}

export async function loadFavoriteMosqueId() {
  const storedMosqueId = await AsyncStorage.getItem(favoriteMosqueStorageKey);

  if (storedMosqueId) {
    return storedMosqueId;
  }

  return defaultMawaqitMosque.id;
}

export async function saveFavoriteMosqueId(mosqueId: string) {
  await AsyncStorage.setItem(favoriteMosqueStorageKey, mosqueId);
}

export async function loadVisibleMosqueIds() {
  const storedValue = await AsyncStorage.getItem(visibleMosquesStorageKey);

  if (!storedValue) {
    return allPrayerTimeMosqueIds;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    if (Array.isArray(parsedValue)) {
      const visibleMosqueIds = parsedValue.filter(
        (mosqueId): mosqueId is string => typeof mosqueId === 'string',
      );

      if (visibleMosqueIds.length > 0) {
        return visibleMosqueIds;
      }
    }
  } catch {
    return allPrayerTimeMosqueIds;
  }

  return allPrayerTimeMosqueIds;
}

export async function saveVisibleMosqueIds(mosqueIds: string[]) {
  await AsyncStorage.setItem(visibleMosquesStorageKey, JSON.stringify(mosqueIds));
}
