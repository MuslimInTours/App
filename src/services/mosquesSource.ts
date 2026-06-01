import { mawaqitMosques, MawaqitMosque } from '../data/mosques';
import { loadCachedValue, saveCachedValue } from './cacheStorage';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const mosquesCacheKey = 'muslimin:remote-mosques:v1';

const isValidCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const mapSupabaseMosque = (row: Record<string, unknown>): MawaqitMosque | null => {
  if (
    typeof row.id !== 'string' ||
    typeof row.name !== 'string' ||
    typeof row.city !== 'string' ||
    !isValidCoordinate(row.latitude) ||
    !isValidCoordinate(row.longitude)
  ) {
    return null;
  }

  const url = typeof row.mawaqit_url === 'string' && row.mawaqit_url ? row.mawaqit_url : undefined;

  return {
    address:
      typeof row.address === 'string' && row.address.trim().length > 0 ? row.address : row.city,
    area: row.city,
    coordinates: {
      latitude: row.latitude,
      longitude: row.longitude,
    },
    id: row.id,
    mawaqitId: typeof row.mawaqit_id === 'number' ? row.mawaqit_id : undefined,
    name: row.name,
    source: url ? 'mawaqit' : 'directory',
    url,
  };
};

const mergeMosques = (remoteMosques: MawaqitMosque[]) => {
  const mosquesById = new Map<string, MawaqitMosque>();

  mawaqitMosques.forEach((mosque) => mosquesById.set(mosque.id, mosque));
  remoteMosques.forEach((mosque) => mosquesById.set(mosque.id, mosque));

  return Array.from(mosquesById.values());
};

export async function fetchMosquesSource() {
  if (!isSupabaseConfigured || !supabase) {
    return mawaqitMosques;
  }

  try {
    const { data, error } = await supabase
      .from('mosques')
      .select('id,name,city,address,latitude,longitude,mawaqit_url,mawaqit_id,is_visible')
      .eq('is_visible', true)
      .order('city', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    const remoteMosques =
      data?.flatMap((row) => {
        const mosque = mapSupabaseMosque(row);
        return mosque ? [mosque] : [];
      }) ?? [];

    if (remoteMosques.length > 0) {
      const mergedMosques = mergeMosques(remoteMosques);
      await saveCachedValue(mosquesCacheKey, mergedMosques);
      return mergedMosques;
    }
  } catch {
    const cachedMosques = await loadCachedValue<MawaqitMosque[]>(mosquesCacheKey);

    if (cachedMosques?.value.length) {
      return cachedMosques.value;
    }
  }

  return mawaqitMosques;
}
