import { QuranTranslator, QuranVerse } from '../data/quran';
import { quranArabicBySurah } from '../data/quranArabic';
import { loadCachedValue, saveCachedValue } from './cacheStorage';

type ApiVerse = {
  chapter: number;
  verse: number;
  text: string;
};

type EditionResponse = {
  quran: ApiVerse[];
};

const ARABIC_QURAN_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf.min.json';

const arabicCache = new Map<number, QuranVerse[]>();
const translationCache = new Map<string, Map<number, string>>();

const buildArabicCacheKey = (surahId: number) => `muslimin:quran:arabic:${surahId}`;

const buildTranslationCacheKey = (surahId: number, translator: QuranTranslator) =>
  `muslimin:quran:translation:${translator.id}:${surahId}`;

const mapToEntries = (verseMap: Map<number, string>) => Array.from(verseMap.entries());

const entriesToMap = (entries: Array<[number, string]>) => new Map<number, string>(entries);

const getLocalArabicSurah = (surahId: number) =>
  (quranArabicBySurah[surahId] ?? []).map((arabic, index) => ({
    arabic,
    number: index + 1,
  }));

async function fetchEdition(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Source indisponible (${response.status})`);
  }

  return (await response.json()) as EditionResponse;
}

export async function fetchArabicSurah(surahId: number) {
  const cached = arabicCache.get(surahId);
  if (cached) {
    return cached;
  }

  const localVerses = getLocalArabicSurah(surahId);
  if (localVerses.length) {
    arabicCache.set(surahId, localVerses);
    return localVerses;
  }

  const persistentCache = await loadCachedValue<QuranVerse[]>(buildArabicCacheKey(surahId));
  if (persistentCache?.value.length) {
    arabicCache.set(surahId, persistentCache.value);
    return persistentCache.value;
  }

  const data = await fetchEdition(ARABIC_QURAN_URL);
  const verses = data.quran
    .filter((verse) => verse.chapter === surahId)
    .map((verse) => ({
      arabic: verse.text,
      number: verse.verse,
    }));

  if (verses.length === 0) {
    throw new Error('Aucun verset arabe trouvé pour cette sourate.');
  }

  arabicCache.set(surahId, verses);
  await saveCachedValue(buildArabicCacheKey(surahId), verses);
  return verses;
}

export async function fetchTranslationSurah(
  surahId: number,
  translator: QuranTranslator,
  verseCount: number,
) {
  if (!translator.source) {
    throw new Error('Aucune source ouverte connectée pour ce traducteur.');
  }

  const persistentCache = await loadCachedValue<Array<[number, string]>>(
    buildTranslationCacheKey(surahId, translator),
  );

  if (persistentCache?.value.length) {
    return pickSurahTranslations(surahId, entriesToMap(persistentCache.value));
  }

  if (translator.source.provider === 'quranpedia') {
    const translations = await fetchQuranpediaTranslation(
      surahId,
      translator.source.bookId,
      verseCount,
    );
    await saveCachedValue(buildTranslationCacheKey(surahId, translator), mapToEntries(translations));
    return translations;
  }

  const cacheKey = translator.source.edition;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return pickSurahTranslations(surahId, cached);
  }

  const data = await fetchEdition(translator.source.url);
  const verseMap = new Map<number, string>();

  data.quran.forEach((verse) => {
    const key = verse.chapter * 1000 + verse.verse;
    verseMap.set(key, verse.text);
  });

  translationCache.set(cacheKey, verseMap);
  const translations = pickSurahTranslations(surahId, verseMap);
  await saveCachedValue(buildTranslationCacheKey(surahId, translator), mapToEntries(translations));
  return translations;
}

async function fetchQuranpediaTranslation(
  surahId: number,
  bookId: number,
  verseCount: number,
) {
  const cacheKey = `quranpedia-${bookId}-${surahId}`;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return pickSurahTranslations(surahId, cached);
  }

  const verseMap = new Map<number, string>();

  await Promise.all(
    Array.from({ length: verseCount }, async (_, index) => {
      const verseNumber = index + 1;
      const response = await fetch(
        `https://api.quranpedia.net/v1/translations/${surahId}/${verseNumber}/fr`,
        { headers: { Accept: 'application/json' } },
      );

      if (!response.ok) {
        return;
      }

      const entries = (await response.json()) as Array<{
        book: { id: number };
        'translation-content': string;
      }>;

      const entry = entries.find((item) => item.book.id === bookId);
      if (entry) {
        verseMap.set(surahId * 1000 + verseNumber, entry['translation-content']);
      }
    }),
  );

  if (verseMap.size === 0) {
    throw new Error('Aucune traduction Quranpedia trouvée pour cette sourate.');
  }

  translationCache.set(cacheKey, verseMap);
  return pickSurahTranslations(surahId, verseMap);
}

function pickSurahTranslations(surahId: number, verseMap: Map<number, string>) {
  const translations = new Map<number, string>();

  verseMap.forEach((text, key) => {
    const chapter = Math.floor(key / 1000);
    const verse = key % 1000;

    if (chapter === surahId) {
      translations.set(verse, text);
    }
  });

  if (translations.size === 0) {
    throw new Error('Aucune traduction trouvée pour cette sourate.');
  }

  return translations;
}
