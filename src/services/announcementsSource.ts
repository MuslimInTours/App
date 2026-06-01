import { Announcement, announcements } from '../data/announcements';
import { backendConfig } from '../config/backend';
import { loadCachedValue, removeCachedValue, saveCachedValue } from './cacheStorage';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type AnnouncementsResult = {
  announcements: Announcement[];
  cachedAt?: string;
  source: 'cache' | 'local' | 'remote';
};

const announcementsCacheKey = 'muslimin:announcements-cache:v1';
const listeners = new Set<() => void>();

export function subscribeAnnouncementsInvalidation(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAnnouncementsChanged() {
  listeners.forEach((listener) => listener());
}

export async function clearAnnouncementsCache() {
  await removeCachedValue(announcementsCacheKey);
  notifyAnnouncementsChanged();
}

const announcementCategories = [
  'Mosquée',
  'Cours',
  'Solidarité',
  'Famille',
  'Prières mortuaires',
];

const isAnnouncementCategory = (value: unknown): value is Announcement['category'] =>
  typeof value === 'string' && announcementCategories.includes(value);

const isAnnouncement = (value: unknown): value is Announcement => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Announcement>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    isAnnouncementCategory(candidate.category) &&
    typeof candidate.date === 'string' &&
    typeof candidate.location === 'string' &&
    typeof candidate.summary === 'string'
  );
};

const normalizeAnnouncementsPayload = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload.filter(isAnnouncement);
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { announcements?: unknown }).announcements)) {
    return (payload as { announcements: unknown[] }).announcements.filter(isAnnouncement);
  }

  return [];
};

const mapSupabaseAnnouncement = (row: Record<string, unknown>): Announcement | null => {
  const candidate = {
    category: row.category,
    date: row.date,
    id: row.id,
    isImportant: row.is_important,
    location: row.location,
    summary: row.summary,
    title: row.title,
  };

  return isAnnouncement(candidate) ? candidate : null;
};

async function fetchSupabaseAnnouncements() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('announcements')
    .select('id,title,category,date,location,summary,is_important')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const remoteAnnouncements =
    data?.flatMap((row) => {
      const announcement = mapSupabaseAnnouncement(row);
      return announcement ? [announcement] : [];
    }) ?? [];

  return remoteAnnouncements;
}

async function fetchRemoteAnnouncements() {
  if (!backendConfig.announcementsUrl) {
    return null;
  }

  const response = await fetch(backendConfig.announcementsUrl);

  if (!response.ok) {
    throw new Error('Backend annonces indisponible.');
  }

  const payload = await response.json();
  const remoteAnnouncements = normalizeAnnouncementsPayload(payload);

  return remoteAnnouncements;
}

export async function fetchAnnouncements(): Promise<AnnouncementsResult> {
  try {
    const remoteAnnouncements = (await fetchSupabaseAnnouncements()) ?? (await fetchRemoteAnnouncements());

    if (remoteAnnouncements) {
      await saveCachedValue(announcementsCacheKey, remoteAnnouncements);

      return {
        announcements: remoteAnnouncements,
        source: 'remote',
      };
    }
  } catch {
    const cachedAnnouncements = await loadCachedValue<Announcement[]>(announcementsCacheKey);

    if (cachedAnnouncements?.value.length) {
      return {
        announcements: cachedAnnouncements.value,
        cachedAt: cachedAnnouncements.savedAt,
        source: 'cache',
      };
    }
  }

  return {
    announcements,
    source: 'local',
  };
}
