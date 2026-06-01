import { Announcement } from '../data/announcements';
import { MawaqitMosque } from '../data/mosques';
import { clearAnnouncementsCache } from './announcementsSource';
import type { FeedbackType } from './feedbackService';
import {
  loadLocalInfoSubmissions,
  updateLocalInfoSubmissionStatus,
} from './localInfoSubmissions';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type AdminAnnouncementInput = Omit<Announcement, 'id'>;
export type AdminAnnouncement = Announcement & {
  createdAt?: string;
  published?: boolean;
};
export type AdminMosqueInput = {
  address: string;
  city: string;
  id: string;
  isVisible: boolean;
  latitude: number;
  longitude: number;
  mawaqitId?: number;
  mawaqitUrl?: string;
  name: string;
};
export type AdminMosque = AdminMosqueInput & {
  createdAt?: string;
};
export type AdminInfoSubmissionStatus = 'archived' | 'new' | 'reviewed';
export type AdminInfoSubmission = {
  contact: string;
  createdAt?: string;
  id: string;
  message: string;
  source: 'local' | 'remote';
  status: AdminInfoSubmissionStatus;
  title: string;
  type: FeedbackType;
};

const mapAdminAnnouncement = (row: Record<string, unknown>): AdminAnnouncement | null => {
  if (
    typeof row.id !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.category !== 'string' ||
    typeof row.date !== 'string' ||
    typeof row.location !== 'string' ||
    typeof row.summary !== 'string'
  ) {
    return null;
  }

  return {
    category: row.category as Announcement['category'],
    createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    date: row.date,
    id: row.id,
    isImportant: Boolean(row.is_important),
    location: row.location,
    published: typeof row.published === 'boolean' ? row.published : undefined,
    summary: row.summary,
    title: row.title,
  };
};

const mapAdminMosque = (row: Record<string, unknown>): AdminMosque | null => {
  if (
    typeof row.id !== 'string' ||
    typeof row.name !== 'string' ||
    typeof row.city !== 'string' ||
    typeof row.address !== 'string' ||
    typeof row.latitude !== 'number' ||
    typeof row.longitude !== 'number'
  ) {
    return null;
  }

  return {
    address: row.address,
    city: row.city,
    createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    id: row.id,
    isVisible: typeof row.is_visible === 'boolean' ? row.is_visible : true,
    latitude: row.latitude,
    longitude: row.longitude,
    mawaqitId: typeof row.mawaqit_id === 'number' ? row.mawaqit_id : undefined,
    mawaqitUrl: typeof row.mawaqit_url === 'string' ? row.mawaqit_url : undefined,
    name: row.name,
  };
};

const isInfoSubmissionStatus = (value: unknown): value is AdminInfoSubmissionStatus =>
  value === 'archived' || value === 'new' || value === 'reviewed';

const mapAdminInfoSubmission = (row: Record<string, unknown>): AdminInfoSubmission | null => {
  if (
    typeof row.id !== 'string' ||
    row.type !== 'info' ||
    typeof row.title !== 'string' ||
    typeof row.message !== 'string' ||
    typeof row.contact !== 'string' ||
    !isInfoSubmissionStatus(row.status)
  ) {
    return null;
  }

  return {
    contact: row.contact,
    createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    id: row.id,
    message: row.message,
    source: 'remote',
    status: row.status,
    title: row.title,
    type: row.type,
  };
};

const announcementCategories: Announcement['category'][] = [
  'Mosquée',
  'Cours',
  'Solidarité',
  'Famille',
  'Prières mortuaires',
];

const isAnnouncementCategory = (value: string): value is Announcement['category'] =>
  announcementCategories.includes(value as Announcement['category']);

const readSubmissionLine = (message: string, label: string) => {
  const line = message
    .split('\n')
    .find((entry) => entry.toLowerCase().startsWith(`${label.toLowerCase()} :`));

  return line?.slice(label.length + 2).trim() ?? '';
};

export function infoSubmissionToAnnouncementInput(
  submission: AdminInfoSubmission,
): AdminAnnouncementInput {
  const categoryValue = readSubmissionLine(submission.message, 'Catégorie');
  const summary = submission.message
    .split('\n\n')
    .slice(1)
    .filter((block) => !block.trim().toLowerCase().startsWith('photo jointe :'))
    .join('\n\n')
    .trim();

  return {
    category: isAnnouncementCategory(categoryValue) ? categoryValue : 'Mosquée',
    date: readSubmissionLine(submission.message, 'Date ou horaire') || 'Date à préciser',
    isImportant: readSubmissionLine(submission.message, 'Annonce importante').toLowerCase() === 'oui',
    location: readSubmissionLine(submission.message, 'Lieu') || 'Lieu à préciser',
    summary: summary || 'Description non renseignée.',
    title: submission.title,
  };
}

export function mosqueToAdminInput(mosque: MawaqitMosque): AdminMosqueInput {
  return {
    address: mosque.address,
    city: mosque.area,
    id: mosque.id,
    isVisible: true,
    latitude: mosque.coordinates.latitude,
    longitude: mosque.coordinates.longitude,
    mawaqitId: mosque.mawaqitId,
    mawaqitUrl: mosque.url,
    name: mosque.name,
  };
}

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase n’est pas encore configuré dans .env.');
  }

  return supabase;
};

export async function getCurrentAdminUser() {
  const client = ensureSupabase();
  const { data, error } = await client.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function signInAdmin(email: string, password: string) {
  const client = ensureSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOutAdmin() {
  const client = ensureSupabase();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function createAnnouncement(input: AdminAnnouncementInput) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('announcements')
    .insert({
      category: input.category,
      date: input.date,
      is_important: Boolean(input.isImportant),
      location: input.location,
      published: true,
      summary: input.summary,
      title: input.title,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await clearAnnouncementsCache();
  return data;
}

export async function createJanazaAnnouncement(input: {
  deceasedName?: string;
  date: string;
  location: string;
  notes: string;
  prayerTime: string;
}) {
  const title = input.deceasedName?.trim()
    ? `Prière mortuaire - ${input.deceasedName.trim()}`
    : 'Prière mortuaire';

  return createAnnouncement({
    category: 'Prières mortuaires',
    date: `${input.date.trim()} · ${input.prayerTime.trim()}`,
    isImportant: true,
    location: input.location.trim(),
    summary: input.notes.trim(),
    title,
  });
}

export async function fetchAdminAnnouncements() {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('announcements')
    .select('id,title,category,date,location,summary,is_important,published,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data?.flatMap((row) => {
    const announcement = mapAdminAnnouncement(row);
    return announcement ? [announcement] : [];
  }) ?? [];
}

export async function updateAnnouncement(
  announcementId: string,
  input: AdminAnnouncementInput & { published?: boolean },
) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('announcements')
    .update({
      category: input.category,
      date: input.date,
      is_important: Boolean(input.isImportant),
      location: input.location,
      published: input.published ?? true,
      summary: input.summary,
      title: input.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', announcementId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  await clearAnnouncementsCache();
  return data;
}

export async function deleteAnnouncement(announcementId: string) {
  const client = ensureSupabase();
  const { error } = await client.from('announcements').delete().eq('id', announcementId);

  if (error) {
    throw error;
  }

  await clearAnnouncementsCache();
}

export async function fetchAdminMosques() {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('mosques')
    .select('id,name,city,address,latitude,longitude,mawaqit_id,mawaqit_url,is_visible,created_at')
    .order('city', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data?.flatMap((row) => {
    const mosque = mapAdminMosque(row);
    return mosque ? [mosque] : [];
  }) ?? [];
}

export async function fetchAdminInfoSubmissions() {
  const localSubmissions = (await loadLocalInfoSubmissions()).map(
    (submission): AdminInfoSubmission => ({
      contact: submission.contact,
      createdAt: submission.createdAt,
      id: submission.id,
      message: submission.message,
      source: 'local',
      status: submission.status,
      title: submission.title,
      type: submission.type,
    }),
  );

  if (!isSupabaseConfigured || !supabase) {
    return localSubmissions;
  }

  const { data, error } = await supabase
    .from('feedback_submissions')
    .select('id,type,title,message,contact,status,created_at')
    .eq('type', 'info')
    .order('created_at', { ascending: false });

  if (error) {
    return localSubmissions;
  }

  const remoteSubmissions = data?.flatMap((row) => {
    const submission = mapAdminInfoSubmission(row);
    return submission ? [submission] : [];
  }) ?? [];

  return [...localSubmissions, ...remoteSubmissions].sort((left, right) =>
    (right.createdAt ?? '').localeCompare(left.createdAt ?? ''),
  );
}

export async function updateInfoSubmissionStatus(
  submissionId: string,
  status: AdminInfoSubmissionStatus,
) {
  if (submissionId.startsWith('local-info-')) {
    await updateLocalInfoSubmissionStatus(submissionId, status);
    return;
  }

  const client = ensureSupabase();
  const { error } = await client
    .from('feedback_submissions')
    .update({ status })
    .eq('id', submissionId)
    .eq('type', 'info');

  if (error) {
    throw error;
  }
}

export async function upsertMosque(input: AdminMosqueInput) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('mosques')
    .upsert({
      address: input.address,
      city: input.city,
      id: input.id,
      is_visible: input.isVisible,
      latitude: input.latitude,
      longitude: input.longitude,
      mawaqit_id: input.mawaqitId ?? null,
      mawaqit_url: input.mawaqitUrl?.trim() ? input.mawaqitUrl.trim() : null,
      name: input.name,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteMosque(mosqueId: string) {
  const client = ensureSupabase();
  const { error } = await client.from('mosques').delete().eq('id', mosqueId);

  if (error) {
    throw error;
  }
}

export async function sendAnnouncementPush(announcementId: string) {
  const client = ensureSupabase();
  const { data, error } = await client.functions.invoke('send-push', {
    body: { announcementId },
  });

  if (error) {
    throw error;
  }

  return data;
}
