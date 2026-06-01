import { useEffect, useState } from 'react';

import { defaultMawaqitMosque, MawaqitMosque } from '../data/mosques';
import {
  fallbackPrayerTimes,
  fetchToursPrayerTimes,
  PrayerTimesResult,
} from '../services/prayerTimes';

export function usePrayerTimes(mosque: MawaqitMosque = defaultMawaqitMosque) {
  const [result, setResult] = useState<PrayerTimesResult>(fallbackPrayerTimes);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchToursPrayerTimes(mosque)
      .then((nextResult) => {
        if (isMounted) {
          setResult(nextResult);
          setError(null);
        }
      })
      .catch((caughtError: Error) => {
        if (isMounted) {
          setResult(fallbackPrayerTimes);
          setError(caughtError.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mosque]);

  return {
    cachedAt: result.cachedAt,
    chouroukTime: result.chouroukTime,
    dateLabel: result.dateLabel,
    error,
    isLoading,
    jumuaTimes: result.jumuaTimes,
    methodLabel: result.methodLabel,
    mosqueName: result.mosqueName,
    prayers: result.prayers,
    source: result.source,
    updatedAt: result.updatedAt,
  };
}
