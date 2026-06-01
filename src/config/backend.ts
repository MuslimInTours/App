import Constants from 'expo-constants';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

type AppExtra = {
  musliminApiUrl?: string;
  supabaseAnonKey?: string;
  supabaseUrl?: string;
  toursMuslimApiUrl?: string;
};

const appExtra = (Constants.expoConfig?.extra ?? {}) as AppExtra;
const publicSupabaseUrl = 'https://stokotegvjpvntuvryzb.supabase.co';
const publicSupabaseAnonKey = 'sb_publishable_QYnbWeZgkb-C3PSLs-o5kQ_Oe8OOnHw';

export const backendBaseUrl =
  typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_MUSLIMIN_API_URL?.trim() ||
      process.env?.EXPO_PUBLIC_TOURS_MUSLIM_API_URL?.trim() ||
      appExtra.musliminApiUrl?.trim() ||
      appExtra.toursMuslimApiUrl?.trim()
    : appExtra.musliminApiUrl?.trim() || appExtra.toursMuslimApiUrl?.trim();

export const supabaseUrl =
  typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_SUPABASE_URL?.trim() ||
      appExtra.supabaseUrl?.trim() ||
      publicSupabaseUrl
    : appExtra.supabaseUrl?.trim() || publicSupabaseUrl;

export const supabaseAnonKey =
  typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      appExtra.supabaseAnonKey?.trim() ||
      publicSupabaseAnonKey
    : appExtra.supabaseAnonKey?.trim() || publicSupabaseAnonKey;

export const backendConfig = {
  announcementsUrl: backendBaseUrl ? `${trimTrailingSlash(backendBaseUrl)}/announcements` : null,
  enabled: Boolean(backendBaseUrl),
  supabaseEnabled: Boolean(supabaseUrl && supabaseAnonKey),
};
