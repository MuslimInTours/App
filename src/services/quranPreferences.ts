import AsyncStorage from '@react-native-async-storage/async-storage';

const favoriteSurahsStorageKey = 'muslimin:quran-favorite-surahs:v1';
const lastReadSurahStorageKey = 'muslimin:quran-last-read-surah:v1';
const preferredReciterStorageKey = 'muslimin:quran-reciter:v1';

export async function loadFavoriteSurahIds() {
  const value = await AsyncStorage.getItem(favoriteSurahsStorageKey);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is number => typeof item === 'number')
      : [];
  } catch {
    return [];
  }
}

export async function saveFavoriteSurahIds(surahIds: number[]) {
  await AsyncStorage.setItem(favoriteSurahsStorageKey, JSON.stringify(surahIds));
}

export async function loadLastReadSurahId() {
  const value = await AsyncStorage.getItem(lastReadSurahStorageKey);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveLastReadSurahId(surahId: number) {
  await AsyncStorage.setItem(lastReadSurahStorageKey, String(surahId));
}

export async function loadPreferredReciterId() {
  return AsyncStorage.getItem(preferredReciterStorageKey);
}

export async function savePreferredReciterId(reciterId: string) {
  await AsyncStorage.setItem(preferredReciterStorageKey, reciterId);
}
