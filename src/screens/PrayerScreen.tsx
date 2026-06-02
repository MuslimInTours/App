import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { MawaqitMosque } from '../data/mosques';
import { iqamaTimes, Prayer, toursCoordinates } from '../data/prayers';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useSelectedMosque } from '../hooks/useSelectedMosque';
import { schedulePrayerReminders } from '../services/notificationService';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing } from '../theme/spacing';
import { formatUpdateTime } from '../utils/date';
import { getNextPrayer, getPrayerCountdown } from '../utils/prayer';
import { calculateQiblaBearing } from '../utils/qibla';

const normalizeDegrees = (degrees: number) => ((degrees % 360) + 360) % 360;

const getShortestAngleDelta = (from: number, to: number) =>
  ((((to - from) % 360) + 540) % 360) - 180;

const getBestDeviceHeading = (heading: Location.LocationHeadingObject) => {
  const nextHeading = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
  return Number.isFinite(nextHeading) ? normalizeDegrees(nextHeading) : null;
};

type PrayerSubTab = 'qibla' | 'times';

export function PrayerScreen() {
  useStyles();

  const { width } = useWindowDimensions();
  const [activeSubTab, setActiveSubTab] = useState<PrayerSubTab>('qibla');
  const [coordinates, setCoordinates] = useState(toursCoordinates);
  const [heading, setHeading] = useState(0);
  const [headingAccuracy, setHeadingAccuracy] = useState(0);
  const [compassStatus, setCompassStatus] = useState('Boussole native en cours de démarrage.');
  const [locationStatus, setLocationStatus] = useState(
    'Position par défaut : Tours. Active la localisation pour un cap précis.',
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isMosqueMenuOpen, setIsMosqueMenuOpen] = useState(false);
  const {
    favoriteMosque,
    favoriteMosqueId,
    selectedMosque,
    selectedMosqueId,
    setFavoriteMosqueId,
    setSelectedMosqueId,
    toggleVisibleMosque,
    allMosques,
    prayerTimeMosques,
    visibleMosqueIds,
    visiblePrayerMosques,
  } = useSelectedMosque();
  const prayerCarouselRef = useRef<ScrollView>(null);
  const smoothedHeadingRef = useRef(0);
  const prayerPageWidth = Math.max(288, width - spacing.lg * 2);
  const selectedMosqueIndex = Math.max(
    0,
    visiblePrayerMosques.findIndex((mosque) => mosque.id === selectedMosqueId),
  );

  const qiblaBearing = useMemo(
    () => calculateQiblaBearing(coordinates.latitude, coordinates.longitude),
    [coordinates.latitude, coordinates.longitude],
  );
  const qiblaRotation = normalizeDegrees(qiblaBearing - heading);
  const qiblaDelta = Math.min(qiblaRotation, 360 - qiblaRotation);
  const isAligned = qiblaDelta <= 6;

  useEffect(() => {
    prayerCarouselRef.current?.scrollTo({
      animated: true,
      x: selectedMosqueIndex * prayerPageWidth,
      y: 0,
    });
  }, [prayerPageWidth, selectedMosqueIndex]);

  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startCompass = async () => {
      if (Platform.OS === 'web') {
        setCompassStatus('Boussole native non disponible sur web. Cap calculé depuis Tours.');
        return;
      }

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (permission.status !== 'granted') {
          setCompassStatus(
            'Autorise la localisation pour utiliser le nord géographique et améliorer la précision.',
          );
        }

        subscription = await Location.watchHeadingAsync(
          (deviceHeading) => {
            const rawHeading = getBestDeviceHeading(deviceHeading);

            if (rawHeading === null) {
              return;
            }

            const previousHeading = smoothedHeadingRef.current;
            const nextHeading =
              previousHeading === 0
                ? rawHeading
                : normalizeDegrees(
                    previousHeading + getShortestAngleDelta(previousHeading, rawHeading) * 0.42,
                  );

            smoothedHeadingRef.current = nextHeading;
            setHeading(nextHeading);
            setHeadingAccuracy(deviceHeading.accuracy);

            if (deviceHeading.accuracy <= 1) {
              setCompassStatus(
                'Précision faible : éloigne le téléphone du métal et fais un mouvement en 8.',
              );
            } else if (deviceHeading.trueHeading >= 0) {
              setCompassStatus('Cap calibré avec le nord géographique.');
            } else {
              setCompassStatus('Cap magnétique utilisé.');
            }
          },
          () => {
            setCompassStatus('Impossible de lire la boussole du téléphone.');
          },
        );
      } catch {
        setCompassStatus('Impossible de démarrer la boussole du téléphone.');
      }
    };

    startCompass();

    return () => {
      isMounted = false;
      try {
        subscription?.remove();
      } catch {
        // Expo Web can expose partial heading subscriptions; ignore cleanup failures.
      }
    };
  }, []);

  const requestLocation = async () => {
    setIsLocating(true);
    setLocationStatus('Demande de localisation...');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationStatus('Localisation refusée. Cap calculé depuis Tours.');
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinates({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });
      setLocationStatus('Position actuelle utilisée pour calculer la qiblah.');
    } catch {
      setLocationStatus('Impossible de récupérer la position. Cap calculé depuis Tours.');
    } finally {
      setIsLocating(false);
    }
  };

  const openMosqueRoute = (latitude: number, longitude: number) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`).catch(
      () => undefined,
    );
  };

  const choosePrayerTimeMosque = (mosqueId: string) => {
    setSelectedMosqueId(mosqueId);
  };

  const setFavoritePrayerMosque = (mosqueId: string) => {
    setFavoriteMosqueId(mosqueId);
    setIsMosqueMenuOpen(false);
  };

  const handlePrayerCarouselEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / prayerPageWidth);
    const nextMosque = visiblePrayerMosques[nextIndex];

    if (nextMosque && nextMosque.id !== selectedMosqueId) {
      setSelectedMosqueId(nextMosque.id);
    }
  };

  return (
    <Screen title="Prières" subtitle="Horaires, iqama et direction de la qiblah pour Tours.">
      <View style={styles.subTabs}>
        <Pressable
          onPress={() => setActiveSubTab('qibla')}
          style={[styles.subTab, activeSubTab === 'qibla' && styles.subTabActive]}
        >
          <Ionicons
            color={activeSubTab === 'qibla' ? colors.primaryDark : colors.mutedInverse}
            name="navigate-circle"
            size={22}
          />
          <Text style={[styles.subTabText, activeSubTab === 'qibla' && styles.subTabTextActive]}>
            Qiblah
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveSubTab('times')}
          style={[styles.subTab, activeSubTab === 'times' && styles.subTabActive]}
        >
          <Ionicons
            color={activeSubTab === 'times' ? colors.primaryDark : colors.mutedInverse}
            name="time"
            size={22}
          />
          <Text style={[styles.subTabText, activeSubTab === 'times' && styles.subTabTextActive]}>
            Horaires
          </Text>
        </Pressable>
      </View>

      {activeSubTab === 'qibla' ? (
        <Card tone="accent" style={styles.qiblaCard}>
          <View style={styles.cardLabelRow}>
            <Ionicons color={colors.secondary} name="navigate-circle" size={22} />
            <Text style={styles.cardLabel}>Direction qiblah</Text>
          </View>
          <View style={styles.qiblaRow}>
            <View style={[styles.compass, isAligned && styles.compassAligned]}>
              <View style={styles.compassInnerRing} />
              <Text style={styles.northLabel}>N</Text>
              <Text style={styles.eastLabel}>E</Text>
              <Text style={styles.southLabel}>S</Text>
              <Text style={styles.westLabel}>O</Text>
              <View style={[styles.makkahOrbit, { transform: [{ rotate: `${qiblaRotation}deg` }] }]}>
                <View
                  style={[
                    styles.makkahMarker,
                    { transform: [{ rotate: `${-qiblaRotation}deg` }] },
                  ]}
                >
                  <Ionicons color={colors.textInverse} name="business" size={18} />
                  <Text style={styles.makkahMarkerText}>Mecque</Text>
                </View>
              </View>
              <Ionicons
                color={isAligned ? colors.success : colors.primaryDark}
                name="navigate"
                size={78}
                style={[styles.compassNeedle, { transform: [{ rotate: `${qiblaRotation}deg` }] }]}
              />
            </View>
            <View style={styles.qiblaTextBlock}>
              <Text style={styles.qiblaDegrees}>{qiblaBearing}° vers la Mecque</Text>
              <Text style={styles.muted}>
                {isAligned
                  ? 'Tu es aligné avec la qiblah.'
                  : 'Tourne le téléphone jusqu’à aligner la flèche avec le repère Mecque.'}
              </Text>
              <Text style={styles.locationStatus}>{locationStatus}</Text>
              <Text style={styles.compassStatus}>{compassStatus}</Text>
              <Pressable
                disabled={isLocating}
                onPress={requestLocation}
                style={[styles.locationButton, isLocating && styles.locationButtonDisabled]}
              >
                <Ionicons color={colors.textInverse} name="locate" size={17} />
                <Text style={styles.locationButtonText}>
                  {isLocating ? 'Localisation...' : 'Utiliser ma position'}
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.compassStats}>
            <View>
              <Text style={styles.statLabel}>Boussole</Text>
              <Text style={styles.statValue}>{Math.round(heading)}°</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Précision</Text>
              <Text style={styles.statValue}>{headingAccuracy}/3</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Ajustement</Text>
              <Text style={styles.statValue}>{Math.round(qiblaRotation)}°</Text>
            </View>
          </View>
        </Card>
      ) : (
        <View>
          <View style={styles.prayerHero}>
            <Pressable
              onPress={() => setFavoritePrayerMosque(selectedMosqueId)}
              style={styles.heroIconButton}
            >
              <Ionicons
                color={selectedMosqueId === favoriteMosqueId ? colors.accent : colors.textInverse}
                name={selectedMosqueId === favoriteMosqueId ? 'star' : 'star-outline'}
                size={23}
              />
            </Pressable>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.sectionTitle}>Horaires de prière</Text>
              <Text style={styles.selectedMosqueText}>Favori : {favoriteMosque.name}</Text>
            </View>
            <Pressable
              onPress={() => setIsMosqueMenuOpen((isOpen) => !isOpen)}
              style={[styles.heroIconButton, isMosqueMenuOpen && styles.heroIconButtonOpen]}
            >
              <Ionicons color={colors.textInverse} name="options" size={23} />
            </Pressable>
          </View>

          {isMosqueMenuOpen ? (
            <View style={styles.mosqueManager}>
              <View style={styles.mosqueManagerHeader}>
                <Text style={styles.mosqueManagerTitle}>Mosquées affichées</Text>
                <Text style={styles.mosqueManagerHint}>Étoile = horaire favori</Text>
              </View>
              {prayerTimeMosques.map((mosque) => {
                const isSelected = mosque.id === selectedMosqueId;
                const isVisible = visibleMosqueIds.includes(mosque.id);
                const isFavorite = mosque.id === favoriteMosqueId;
                const canHide = !isVisible || visibleMosqueIds.length > 1;

                return (
                  <View
                    key={mosque.id}
                    style={[
                      styles.mosqueManagerItem,
                      isSelected && styles.mosqueManagerItemSelected,
                    ]}
                  >
                    <Pressable
                      disabled={!canHide}
                      onPress={() => toggleVisibleMosque(mosque.id)}
                      style={[styles.toggleMosqueButton, !canHide && styles.disabledButton]}
                    >
                      <Ionicons
                        color={isVisible ? colors.primary : colors.muted}
                        name={isVisible ? 'checkmark-circle' : 'add-circle-outline'}
                        size={24}
                      />
                    </Pressable>
                    <Pressable
                      disabled={!isVisible}
                      onPress={() => choosePrayerTimeMosque(mosque.id)}
                      style={styles.mosqueManagerText}
                    >
                      <Text
                        style={[
                          styles.mosqueMenuName,
                          isSelected && styles.mosqueMenuNameSelected,
                        ]}
                      >
                        {mosque.name}
                      </Text>
                      <Text style={styles.mosqueMenuArea}>
                        {mosque.area} · {isVisible ? 'affichée' : 'masquée'}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={!isVisible}
                      onPress={() => setFavoritePrayerMosque(mosque.id)}
                      style={[styles.favoriteButton, !isVisible && styles.disabledButton]}
                    >
                      <Ionicons
                        color={isFavorite ? colors.accent : colors.muted}
                        name={isFavorite ? 'star' : 'star-outline'}
                        size={23}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null}

          <ScrollView
            decelerationRate="fast"
            horizontal
            onMomentumScrollEnd={handlePrayerCarouselEnd}
            pagingEnabled
            ref={prayerCarouselRef}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={prayerPageWidth}
            style={styles.prayerCarousel}
          >
            {visiblePrayerMosques.map((mosque) => (
              <PrayerTimesPage
                isFavorite={mosque.id === favoriteMosqueId}
                key={mosque.id}
                mosque={mosque}
                pageWidth={prayerPageWidth}
              />
            ))}
          </ScrollView>

          <View style={styles.carouselDots}>
            {visiblePrayerMosques.map((mosque) => (
              <Pressable
                key={mosque.id}
                onPress={() => choosePrayerTimeMosque(mosque.id)}
                style={[
                  styles.carouselDot,
                  mosque.id === selectedMosqueId && styles.carouselDotActive,
                ]}
              >
                {mosque.id === favoriteMosqueId ? (
                  <Ionicons color={colors.textInverse} name="star" size={8} />
                ) : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.swipeHint}>
            <Ionicons color={colors.accentSoft} name="swap-horizontal" size={16} />
            <Text style={styles.swipeHintText}>Glisse pour changer de mosquée</Text>
          </View>

          <SectionHeader title="Iqama" />
          {iqamaTimes.map((prayer) => (
            <View key={prayer.name} style={styles.timeRow}>
              <Text style={styles.prayerName}>{prayer.name}</Text>
              <Text style={styles.time}>{prayer.time}</Text>
            </View>
          ))}
        </View>
      )}

      <SectionHeader title="Mosquées localisées" />
      {allMosques.map((mosque) => (
        <Pressable
          key={mosque.id}
          onPress={() =>
            openMosqueRoute(mosque.coordinates.latitude, mosque.coordinates.longitude)
          }
          style={styles.mosqueRow}
        >
          <View style={styles.mosqueIcon}>
            <Ionicons
              color={mosque.source === 'mawaqit' ? colors.primary : colors.secondary}
              name={mosque.source === 'mawaqit' ? 'radio' : 'location'}
              size={20}
            />
          </View>
          <View style={styles.mosqueTextBlock}>
            <Text style={styles.mosqueName}>{mosque.name}</Text>
            <Text style={styles.mosqueAddress}>{mosque.address}</Text>
            <Text style={styles.mosqueMeta}>
              {mosque.source === 'mawaqit' ? 'Horaires Mawaqit reliés' : 'Adresse localisée'}
            </Text>
          </View>
          <Ionicons color={colors.muted} name="chevron-forward" size={18} />
        </Pressable>
      ))}
    </Screen>
  );
}

function PrayerTimesPage({
  isFavorite,
  mosque,
  pageWidth,
}: {
  isFavorite: boolean;
  mosque: MawaqitMosque;
  pageWidth: number;
}) {
  useStyles();

  const [now, setNow] = useState(() => new Date());
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [isSchedulingReminder, setIsSchedulingReminder] = useState(false);
  const { cachedAt, chouroukTime, dateLabel, error, isLoading, jumuaTimes, prayers, source, updatedAt } =
    usePrayerTimes(mosque);
  const nextPrayer = getNextPrayer(prayers, now);
  const countdown = getPrayerCountdown(nextPrayer, now);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activateReminders = async () => {
    setIsSchedulingReminder(true);

    try {
      const message = await schedulePrayerReminders(prayers, mosque.name);
      setReminderMessage(message);
    } catch {
      setReminderMessage('Impossible de programmer les rappels pour le moment.');
    } finally {
      setIsSchedulingReminder(false);
    }
  };

  const activatePrayerReminder = async (prayer: Prayer) => {
    setIsSchedulingReminder(true);

    try {
      const message = await schedulePrayerReminders([prayer], mosque.name);
      setReminderMessage(message);
    } catch {
      setReminderMessage(`Impossible de programmer le rappel ${prayer.name}.`);
    } finally {
      setIsSchedulingReminder(false);
    }
  };

  return (
    <View style={[styles.prayerPage, { width: pageWidth }]}>
      <Text style={styles.nextPrayerTitle}>
        {nextPrayer.name} dans <Text style={styles.nextPrayerCountdown}>{countdown}</Text>
      </Text>

      <View style={styles.selectedMosqueField}>
        <View style={styles.selectedMosqueIcon}>
          <Ionicons color={colors.textInverse} name="business" size={18} />
        </View>
        <View style={styles.selectedMosqueFieldText}>
          <Text style={styles.selectedMosqueFieldTitle}>{mosque.name}</Text>
          <Text style={styles.selectedMosqueFieldSubtitle}>{mosque.area}</Text>
        </View>
        {isFavorite ? <Ionicons color={colors.accent} name="star" size={20} /> : null}
      </View>

      <Text style={styles.pageDate}>{isLoading ? 'Chargement...' : dateLabel}</Text>
      <Text style={[styles.prayerSource, error && styles.prayerSourceWarning]}>
        {error
          ? 'Mawaqit indisponible, secours calculé affiché'
          : source === 'mawaqit'
            ? 'Horaires Mawaqit'
            : 'Horaires calculés'}
      </Text>
      <Text style={styles.prayerUpdatedAt}>
        Dernière mise à jour : {formatUpdateTime(cachedAt ?? updatedAt)}
      </Text>

      <View style={styles.prayerDisplayList}>
        {prayers.map((prayer) => {
          const isNextPrayer = prayer.name === nextPrayer.name;

          return (
            <View
              key={prayer.name}
              style={[styles.prayerDisplayRow, isNextPrayer && styles.prayerDisplayRowActive]}
            >
              <View>
                <Text
                  style={[
                    styles.prayerDisplayName,
                    isNextPrayer && styles.prayerDisplayNameActive,
                  ]}
                >
                  {prayer.name}
                </Text>
                <Text
                  style={[
                    styles.prayerDisplayTime,
                    isNextPrayer && styles.prayerDisplayTimeActive,
                  ]}
                >
                  {prayer.time}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Activer le rappel ${prayer.name}`}
                accessibilityRole="button"
                disabled={isLoading || isSchedulingReminder}
                onPress={() => activatePrayerReminder(prayer)}
                style={[
                  styles.prayerDisplayIcon,
                  isNextPrayer && styles.prayerDisplayIconActive,
                  (isLoading || isSchedulingReminder) && styles.disabledButton,
                ]}
              >
                <Ionicons
                  color={isNextPrayer ? colors.textInverse : colors.accentSoft}
                  name={isNextPrayer ? 'notifications' : 'notifications-outline'}
                  size={24}
                />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.extraTimesRow}>
        <View style={styles.extraTimeItem}>
          <Ionicons color={colors.accentSoft} name="sunny-outline" size={18} />
          <Text style={styles.extraTimeText}>Chourouk {chouroukTime ?? '--:--'}</Text>
        </View>
        <Text style={styles.extraTimeText}>
          Jumu’a {jumuaTimes && jumuaTimes.length > 0 ? jumuaTimes.join(' | ') : '--:--'}
        </Text>
      </View>

      <Pressable
        disabled={isLoading || isSchedulingReminder}
        onPress={activateReminders}
        style={[styles.reminderButton, (isLoading || isSchedulingReminder) && styles.disabledButton]}
      >
        <Ionicons color={colors.textInverse} name="notifications-outline" size={18} />
        <Text style={styles.reminderButtonText}>
          {isSchedulingReminder ? 'Programmation...' : 'Activer les rappels'}
        </Text>
      </Pressable>

      {reminderMessage ? <Text style={styles.reminderMessage}>{reminderMessage}</Text> : null}
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  subTabs: {
    backgroundColor: colors.chromeSoft,
    borderColor: colors.chromeBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.xs,
  },
  subTab: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
  },
  subTabActive: {
    backgroundColor: colors.accentSoft,
  },
  subTabText: {
    color: colors.mutedInverse,
    fontSize: 14,
    fontWeight: '900',
  },
  subTabTextActive: {
    color: colors.primaryDark,
  },
  qiblaCard: {
    marginBottom: spacing.xl,
  },
  cardLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardLabel: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  qiblaRow: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  compass: {
    alignItems: 'center',
    aspectRatio: 1,
    alignSelf: 'center',
    backgroundColor: colors.creamSurface,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    marginTop: spacing.sm,
    overflow: 'hidden',
    width: 238,
  },
  compassAligned: {
    borderColor: colors.success,
    borderWidth: 3,
  },
  compassInnerRing: {
    borderColor: colors.successBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 178,
    position: 'absolute',
    width: 178,
  },
  northLabel: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
    position: 'absolute',
    top: 12,
  },
  eastLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    position: 'absolute',
    right: 16,
  },
  southLabel: {
    bottom: 12,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    position: 'absolute',
  },
  westLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    left: 16,
    position: 'absolute',
  },
  makkahOrbit: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingTop: 16,
  },
  makkahMarker: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.creamBorder,
    borderRadius: 999,
    borderWidth: 2,
    gap: 1,
    minWidth: 74,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  makkahMarkerText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '900',
  },
  compassNeedle: {
    marginTop: 12,
  },
  qiblaTextBlock: {
    alignItems: 'center',
    maxWidth: 360,
  },
  qiblaDegrees: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  locationStatus: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  compassStatus: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  locationButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  locationButtonDisabled: {
    opacity: 0.62,
  },
  locationButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '900',
  },
  compassStats: {
    borderTopColor: colors.chromeBorderSoft,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  prayerHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroIconButton: {
    alignItems: 'center',
    backgroundColor: colors.chrome,
    borderColor: colors.chromeBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  heroIconButtonOpen: {
    backgroundColor: colors.chromeStrong,
  },
  heroTitleBlock: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.textInverse,
    fontSize: 21,
    fontWeight: '900',
  },
  selectedMosqueText: {
    color: colors.creamTextMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  mosqueManager: {
    backgroundColor: colors.panelSolid,
    borderColor: colors.chromeBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  mosqueManagerHeader: {
    backgroundColor: colors.chromeFaint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  mosqueManagerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  mosqueManagerHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  mosqueManagerItem: {
    alignItems: 'center',
    borderTopColor: colors.chrome,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  mosqueManagerItemSelected: {
    backgroundColor: colors.primaryWash,
  },
  toggleMosqueButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  mosqueManagerText: {
    flex: 1,
  },
  mosqueMenuName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  mosqueMenuNameSelected: {
    color: colors.accentSoft,
  },
  mosqueMenuArea: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  favoriteButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  disabledButton: {
    opacity: 0.42,
  },
  prayerCarousel: {
    marginHorizontal: -spacing.lg,
  },
  prayerPage: {
    paddingHorizontal: spacing.lg,
  },
  nextPrayerTitle: {
    color: colors.textInverse,
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  nextPrayerCountdown: {
    fontWeight: '900',
  },
  selectedMosqueField: {
    alignItems: 'center',
    backgroundColor: colors.chromeBare,
    borderColor: colors.chromeBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectedMosqueIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryWashSolid,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  selectedMosqueFieldText: {
    flex: 1,
  },
  selectedMosqueFieldTitle: {
    color: colors.textInverse,
    fontSize: 18,
    fontWeight: '900',
  },
  selectedMosqueFieldSubtitle: {
    color: colors.mutedInverse,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  pageDate: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  prayerSource: {
    color: colors.mutedInverse,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  prayerSourceWarning: {
    color: colors.accentSoft,
  },
  prayerUpdatedAt: {
    color: colors.mutedInverse,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  prayerDisplayList: {
    marginTop: spacing.lg,
  },
  prayerDisplayRow: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    minHeight: 106,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  prayerDisplayRowActive: {
    backgroundColor: colors.primary,
  },
  prayerDisplayName: {
    color: colors.textInverse,
    fontSize: 24,
    fontWeight: '500',
  },
  prayerDisplayNameActive: {
    fontWeight: '800',
  },
  prayerDisplayTime: {
    color: colors.textInverse,
    fontSize: 58,
    fontWeight: '300',
    letterSpacing: 0,
    lineHeight: 66,
  },
  prayerDisplayTimeActive: {
    fontWeight: '900',
  },
  prayerDisplayIcon: {
    alignItems: 'center',
    backgroundColor: colors.chromeMedium,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  prayerDisplayIconActive: {
    backgroundColor: colors.panelDeepStrong,
  },
  extraTimesRow: {
    alignItems: 'center',
    backgroundColor: colors.chromeFaint,
    borderColor: colors.chrome,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  extraTimeItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  extraTimeText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  reminderButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.chrome,
    borderColor: colors.chromeMore,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reminderButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '900',
  },
  reminderMessage: {
    color: colors.mutedInverse,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  carouselDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  carouselDot: {
    alignItems: 'center',
    backgroundColor: colors.creamWash,
    borderRadius: 999,
    height: 12,
    justifyContent: 'center',
    width: 12,
  },
  carouselDotActive: {
    backgroundColor: colors.primary,
    width: 28,
  },
  swipeHint: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  swipeHintText: {
    color: colors.mutedInverse,
    fontSize: 12,
    fontWeight: '800',
  },
  timeRow: {
    alignItems: 'center',
    backgroundColor: colors.cardDefault,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  prayerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  time: {
    color: colors.accentSoft,
    fontSize: 18,
    fontWeight: '900',
  },
  mosqueRow: {
    alignItems: 'center',
    backgroundColor: colors.cardDefault,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  mosqueIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  mosqueTextBlock: {
    flex: 1,
  },
  mosqueName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  mosqueAddress: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },
  mosqueMeta: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
