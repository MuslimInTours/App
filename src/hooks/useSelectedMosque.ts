import { useEffect, useMemo, useState } from 'react';

import { defaultMawaqitMosque, mawaqitMosques } from '../data/mosques';
import {
  loadFavoriteMosqueId,
  loadSelectedMosqueId,
  loadVisibleMosqueIds,
  saveFavoriteMosqueId,
  saveSelectedMosqueId,
  saveVisibleMosqueIds,
} from '../services/mosqueStorage';
import { fetchMosquesSource } from '../services/mosquesSource';

export function useSelectedMosque() {
  const [allMosques, setAllMosques] = useState(mawaqitMosques);
  const [selectedMosqueId, setSelectedMosqueIdState] = useState(defaultMawaqitMosque.id);
  const [favoriteMosqueId, setFavoriteMosqueIdState] = useState(defaultMawaqitMosque.id);
  const [visibleMosqueIds, setVisibleMosqueIds] = useState(
    mawaqitMosques.filter((mosque) => mosque.source === 'mawaqit').map((mosque) => mosque.id),
  );

  const prayerTimeMosques = useMemo(
    () => allMosques.filter((mosque) => mosque.source === 'mawaqit'),
    [allMosques],
  );

  useEffect(() => {
    let isMounted = true;

    fetchMosquesSource().then((nextMosques) => {
      if (isMounted) {
        setAllMosques(nextMosques);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadSelectedMosqueId(), loadFavoriteMosqueId(), loadVisibleMosqueIds()]).then(
      ([storedMosqueId, storedFavoriteMosqueId, storedVisibleMosqueIds]) => {
        if (!isMounted) {
          return;
        }

        const selectedIsVisible = storedVisibleMosqueIds.includes(storedMosqueId);
        const favoriteIsVisible = storedVisibleMosqueIds.includes(storedFavoriteMosqueId);
        const nextSelectedMosqueId = selectedIsVisible
          ? storedMosqueId
          : favoriteIsVisible
            ? storedFavoriteMosqueId
            : storedVisibleMosqueIds[0];

        setVisibleMosqueIds(storedVisibleMosqueIds);
        setFavoriteMosqueIdState(storedFavoriteMosqueId);
        setSelectedMosqueIdState(nextSelectedMosqueId);
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const visiblePrayerMosques = useMemo(() => {
    const mosques = prayerTimeMosques.filter((mosque) => visibleMosqueIds.includes(mosque.id));
    return mosques.length > 0 ? mosques : [defaultMawaqitMosque];
  }, [prayerTimeMosques, visibleMosqueIds]);

  const selectedMosque = useMemo(
    () =>
      visiblePrayerMosques.find((mosque) => mosque.id === selectedMosqueId) ??
      visiblePrayerMosques[0],
    [selectedMosqueId, visiblePrayerMosques],
  );

  const favoriteMosque = useMemo(
    () => prayerTimeMosques.find((mosque) => mosque.id === favoriteMosqueId) ?? defaultMawaqitMosque,
    [favoriteMosqueId, prayerTimeMosques],
  );

  const setSelectedMosqueId = (mosqueId: string) => {
    setSelectedMosqueIdState(mosqueId);
    saveSelectedMosqueId(mosqueId).catch(() => undefined);
  };

  const setFavoriteMosqueId = (mosqueId: string) => {
    setFavoriteMosqueIdState(mosqueId);
    saveFavoriteMosqueId(mosqueId).catch(() => undefined);

    if (!visibleMosqueIds.includes(mosqueId)) {
      const nextVisibleMosqueIds = [...visibleMosqueIds, mosqueId];
      setVisibleMosqueIds(nextVisibleMosqueIds);
      saveVisibleMosqueIds(nextVisibleMosqueIds).catch(() => undefined);
    }

    setSelectedMosqueId(mosqueId);
  };

  const toggleVisibleMosque = (mosqueId: string) => {
    const isCurrentlyVisible = visibleMosqueIds.includes(mosqueId);

    if (isCurrentlyVisible && visibleMosqueIds.length <= 1) {
      return;
    }

    const nextVisibleMosqueIds = isCurrentlyVisible
      ? visibleMosqueIds.filter((visibleMosqueId) => visibleMosqueId !== mosqueId)
      : [...visibleMosqueIds, mosqueId];

    setVisibleMosqueIds(nextVisibleMosqueIds);
    saveVisibleMosqueIds(nextVisibleMosqueIds).catch(() => undefined);

    if (isCurrentlyVisible && selectedMosqueId === mosqueId) {
      const nextSelectedMosqueId = nextVisibleMosqueIds.includes(favoriteMosqueId)
        ? favoriteMosqueId
        : nextVisibleMosqueIds[0];

      setSelectedMosqueId(nextSelectedMosqueId);
    }

    if (isCurrentlyVisible && favoriteMosqueId === mosqueId) {
      const nextFavoriteMosqueId = nextVisibleMosqueIds[0];
      setFavoriteMosqueIdState(nextFavoriteMosqueId);
      saveFavoriteMosqueId(nextFavoriteMosqueId).catch(() => undefined);
    }
  };

  return {
    favoriteMosque,
    favoriteMosqueId,
    allMosques,
    prayerTimeMosques,
    selectedMosque,
    selectedMosqueId: selectedMosque.id,
    setFavoriteMosqueId,
    setSelectedMosqueId,
    toggleVisibleMosque,
    visibleMosqueIds,
    visiblePrayerMosques,
  };
}
