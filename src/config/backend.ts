declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getEnv = (name: string) =>
  typeof process !== 'undefined' ? process.env?.[name]?.trim() : undefined;

export const backendBaseUrl =
  getEnv('EXPO_PUBLIC_MUSLIMIN_API_URL') || getEnv('EXPO_PUBLIC_TOURS_MUSLIM_API_URL');

export const supabaseUrl = getEnv('EXPO_PUBLIC_SUPABASE_URL');

export const supabaseAnonKey = getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const backendConfig = {
  announcementsUrl: backendBaseUrl ? `${trimTrailingSlash(backendBaseUrl)}/announcements` : null,
  enabled: Boolean(backendBaseUrl),
  supabaseEnabled: Boolean(supabaseUrl && supabaseAnonKey),
};
