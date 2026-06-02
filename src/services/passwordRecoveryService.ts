import { isSupabaseConfigured, supabase } from './supabaseClient';

type PasswordRecoveryParams = {
  accessToken: string;
  refreshToken: string;
  type: string;
};

const getWindowLocation = () =>
  typeof window === 'undefined' ? null : window.location;

const getUrlParams = () => {
  const location = getWindowLocation();

  if (!location) {
    return null;
  }

  const params = new URLSearchParams();
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(location.search.replace(/^\?/, ''));

  hashParams.forEach((value, key) => params.set(key, value));
  searchParams.forEach((value, key) => params.set(key, value));

  return params;
};

export const getPasswordRecoveryParams = (): PasswordRecoveryParams | null => {
  const params = getUrlParams();

  if (!params) {
    return null;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type') ?? '';

  if (!accessToken || !refreshToken || type !== 'recovery') {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    type,
  };
};

export const hasPasswordRecoveryParams = () => Boolean(getPasswordRecoveryParams());

export const clearPasswordRecoveryUrl = () => {
  const location = getWindowLocation();

  if (!location || typeof window.history?.replaceState !== 'function') {
    return;
  }

  window.history.replaceState(null, '', location.pathname);
};

export async function startPasswordRecoverySession() {
  const params = getPasswordRecoveryParams();

  if (!params) {
    throw new Error('Lien de récupération invalide ou expiré.');
  }
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase n’est pas configuré.');
  }

  const { error } = await supabase.auth.setSession({
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
  });

  if (error) {
    throw error;
  }

  clearPasswordRecoveryUrl();
}

export async function updateRecoveredPassword(password: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase n’est pas configuré.');
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}
