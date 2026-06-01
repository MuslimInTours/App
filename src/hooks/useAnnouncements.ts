import { useEffect, useState } from 'react';

import { Announcement, announcements as fallbackAnnouncements } from '../data/announcements';
import {
  fetchAnnouncements,
  subscribeAnnouncementsInvalidation,
} from '../services/announcementsSource';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(fallbackAnnouncements);
  const [source, setSource] = useState<'cache' | 'local' | 'remote'>('local');
  const [cachedAt, setCachedAt] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncements = () => {
      setIsLoading(true);
      setError(null);

      fetchAnnouncements()
        .then((result) => {
          if (isMounted) {
            setAnnouncements(result.announcements);
            setSource(result.source);
            setCachedAt(result.cachedAt);
            setUpdatedAt(result.cachedAt ?? new Date().toISOString());
          }
        })
        .catch((caughtError: Error) => {
          if (isMounted) {
            setError(caughtError.message);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    };

    loadAnnouncements();
    const unsubscribe = subscribeAnnouncementsInvalidation(loadAnnouncements);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    announcements,
    cachedAt,
    error,
    isLoading,
    source,
    updatedAt,
  };
}
