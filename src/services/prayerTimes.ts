import { defaultMawaqitMosque, MawaqitMosque } from '../data/mosques';
import { Prayer, prayersToday, toursCoordinates } from '../data/prayers';
import { loadCachedValue, saveCachedValue } from './cacheStorage';

type AlAdhanTimingsResponse = {
  code: number;
  data?: {
    date?: {
      readable?: string;
    };
    meta?: {
      method?: {
        name?: string;
      };
    };
    timings?: Record<string, string>;
  };
  status: string;
};

export type PrayerTimesResult = {
  cachedAt?: string;
  chouroukTime?: string;
  dateLabel: string;
  jumuaTimes?: string[];
  methodLabel: string;
  mosqueName?: string;
  prayers: Prayer[];
  source: 'aladhan' | 'fallback' | 'mawaqit';
  updatedAt?: string;
};

type MawaqitConfData = {
  calendar?: string[][][];
  jumua?: string | null;
  jumua2?: string | null;
  jumua3?: string | null;
  name?: string;
  shuruq?: string;
  times?: string[];
  timezone?: string;
};

const prayerKeys = [
  ['Fajr', 'Fajr'],
  ['Dhuhr', 'Dhuhr'],
  ['Asr', 'Asr'],
  ['Maghrib', 'Maghrib'],
  ['Isha', 'Isha'],
] as const;

const cleanTime = (value?: string) => value?.match(/\d{2}:\d{2}/)?.[0] ?? null;

const buildPrayerCacheKey = (mosqueId: string) => {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();

  return `muslimin:prayer-times:${mosqueId}:${year}-${month}-${day}`;
};

const buildDateLabel = () =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date());

const extractJsonObject = (html: string, marker: string) => {
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Configuration Mawaqit introuvable.');
  }

  const jsonStart = html.indexOf('{', markerIndex);
  if (jsonStart === -1) {
    throw new Error('Configuration Mawaqit invalide.');
  }

  let depth = 0;
  let isEscaped = false;
  let isInString = false;
  let quote = '';

  for (let index = jsonStart; index < html.length; index += 1) {
    const character = html[index];

    if (isInString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === '\\') {
        isEscaped = true;
      } else if (character === quote) {
        isInString = false;
      }

      continue;
    }

    if (character === '"' || character === "'") {
      isInString = true;
      quote = character;
      continue;
    }

    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;

      if (depth === 0) {
        return html.slice(jsonStart, index + 1);
      }
    }
  }

  throw new Error('Configuration Mawaqit incomplète.');
};

async function fetchMawaqitPrayerTimes(mosque: MawaqitMosque): Promise<PrayerTimesResult> {
  if (!mosque.url) {
    throw new Error('Cette mosquée n’a pas encore de page Mawaqit reliée.');
  }

  const response = await fetch(mosque.url);

  if (!response.ok) {
    throw new Error('Impossible de récupérer les horaires Mawaqit.');
  }

  const html = await response.text();
  const confData = JSON.parse(extractJsonObject(html, 'let confData = ')) as MawaqitConfData;
  const today = new Date();
  const chouroukTime =
    cleanTime(
      confData.calendar?.[today.getMonth()]?.[today.getDate()]?.[1] ?? confData.shuruq,
    ) ?? undefined;
  const jumuaTimes = [confData.jumua, confData.jumua2, confData.jumua3].flatMap((time) => {
    const cleanJumuaTime = cleanTime(time ?? undefined);
    return cleanJumuaTime ? [cleanJumuaTime] : [];
  });

  if (!Array.isArray(confData.times) || confData.times.length < prayerKeys.length) {
    throw new Error('Horaires Mawaqit incomplets.');
  }

  const prayers = prayerKeys.map(([name], index) => {
    const time = cleanTime(confData.times?.[index]);

    if (!time) {
      throw new Error('Horaire Mawaqit invalide.');
    }

    return { name, time };
  });

  return {
    chouroukTime,
    dateLabel: buildDateLabel(),
    jumuaTimes,
    methodLabel: 'Horaires officiels de la mosquée sur Mawaqit',
    mosqueName: confData.name ?? mosque.name,
    prayers,
    source: 'mawaqit',
    updatedAt: new Date().toISOString(),
  };
}

async function loadCachedPrayerTimes(mosque: MawaqitMosque) {
  const cachedPrayerTimes = await loadCachedValue<PrayerTimesResult>(buildPrayerCacheKey(mosque.id));

  if (!cachedPrayerTimes) {
    return null;
  }

  return {
    ...cachedPrayerTimes.value,
    cachedAt: cachedPrayerTimes.savedAt,
    methodLabel: `Horaires Mawaqit mis en cache à ${new Date(
      cachedPrayerTimes.savedAt,
    ).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
  };
}

async function fetchAlAdhanPrayerTimes(mosque: MawaqitMosque): Promise<PrayerTimesResult> {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();

  const params = new URLSearchParams({
    latitude: (mosque.coordinates?.latitude ?? toursCoordinates.latitude).toString(),
    longitude: (mosque.coordinates?.longitude ?? toursCoordinates.longitude).toString(),
    method: '12',
    school: '0',
    timezonestring: 'Europe/Paris',
  });

  const response = await fetch(
    `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error('Impossible de récupérer les horaires de prière.');
  }

  const json = (await response.json()) as AlAdhanTimingsResponse;
  const timings = json.data?.timings;

  if (json.code !== 200 || !timings) {
    throw new Error('Réponse horaires invalide.');
  }

  const prayers: Prayer[] = [];

  prayerKeys.forEach(([name, key]) => {
    const time = cleanTime(timings[key]);
    if (time) {
      prayers.push({ name, time });
    }
  });

  if (prayers.length !== prayerKeys.length) {
    throw new Error('Horaires incomplets.');
  }

  return {
    chouroukTime: cleanTime(timings.Sunrise) ?? undefined,
    dateLabel: json.data?.date?.readable ?? `${day}/${month}/${year}`,
    methodLabel: json.data?.meta?.method?.name ?? 'Union des Organisations Islamiques de France',
    mosqueName: mosque.name,
    prayers,
    source: 'aladhan',
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchToursPrayerTimes(
  mosque = defaultMawaqitMosque,
): Promise<PrayerTimesResult> {
  try {
    const mawaqitPrayerTimes = await fetchMawaqitPrayerTimes(mosque);
    await saveCachedValue(buildPrayerCacheKey(mosque.id), mawaqitPrayerTimes);
    return mawaqitPrayerTimes;
  } catch {
    const cachedPrayerTimes = await loadCachedPrayerTimes(mosque);

    if (cachedPrayerTimes) {
      return cachedPrayerTimes;
    }

    return fetchAlAdhanPrayerTimes(mosque);
  }
}

export const fallbackPrayerTimes: PrayerTimesResult = {
  dateLabel: 'Horaires locaux de secours',
  methodLabel: 'Données locales provisoires',
  mosqueName: defaultMawaqitMosque.name,
  prayers: prayersToday,
  source: 'fallback',
  updatedAt: new Date().toISOString(),
};
