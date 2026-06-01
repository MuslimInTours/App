import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { buildSurahAudioUrl, canReciterReadSurah, quranReciters } from '../data/quranAudio';
import { QuranVerse, quranJuz, quranTranslators, surahs } from '../data/quran';
import {
  downloadSurahAudio,
  getDownloadedAudioState,
} from '../services/quranAudioDownloads';
import { fetchArabicSurah, fetchTranslationSurah } from '../services/quranSource';
import {
  loadFavoriteSurahIds,
  loadLastReadSurahId,
  loadPreferredReciterId,
  saveFavoriteSurahIds,
  saveLastReadSurahId,
  savePreferredReciterId,
} from '../services/quranPreferences';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

type QuranMode = 'reading' | 'listening';

export function QuranScreen() {
  useStyles();

  const [mode, setMode] = useState<QuranMode>('reading');
  const [query, setQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedJuzId, setSelectedJuzId] = useState<number | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedTranslatorId, setSelectedTranslatorId] = useState(quranTranslators[0].id);
  const [arabicVerses, setArabicVerses] = useState<QuranVerse[]>([]);
  const [isLoadingArabic, setIsLoadingArabic] = useState(false);
  const [arabicError, setArabicError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Map<number, string>>(new Map());
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [favoriteSurahIds, setFavoriteSurahIds] = useState<number[]>([]);
  const [lastReadSurahId, setLastReadSurahId] = useState<number | null>(null);
  const [selectedAudioSurahId, setSelectedAudioSurahId] = useState(1);
  const [selectedReciterId, setSelectedReciterId] = useState(quranReciters[0].id);
  const [isReciterMenuOpen, setIsReciterMenuOpen] = useState(false);
  const [downloadPanelSurahId, setDownloadPanelSurahId] = useState<number | null>(null);
  const [downloadReciterIds, setDownloadReciterIds] = useState<string[]>([]);
  const [downloadedAudioUri, setDownloadedAudioUri] = useState<string | null>(null);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [audioDownloadMessage, setAudioDownloadMessage] = useState<string | null>(null);

  const selectedReciter =
    quranReciters.find((reciter) => reciter.id === selectedReciterId) ?? quranReciters[0];
  const selectedAudioSurah =
    surahs.find((surah) => surah.id === selectedAudioSurahId) ?? surahs[0];
  const remoteAudioUrl = canReciterReadSurah(selectedReciter, selectedAudioSurahId)
    ? buildSurahAudioUrl(selectedReciter, selectedAudioSurahId)
    : null;
  const audioUrl = downloadedAudioUri ?? remoteAudioUrl;
  const hasOfflineAudio = Boolean(downloadedAudioUri);
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null);
  const audioStatus = useAudioPlayerStatus(player);

  const filteredSurahs = useMemo(() => {
    const baseSurahs = showFavoritesOnly
      ? surahs.filter((surah) => favoriteSurahIds.includes(surah.id))
      : surahs;

    if (selectedJuzId) {
      const juzIndex = quranJuz.findIndex((juz) => juz.id === selectedJuzId);
      const selectedJuz = quranJuz[juzIndex];
      const nextJuz = quranJuz[juzIndex + 1];

      return baseSurahs.filter(
        (surah) =>
          surah.id >= selectedJuz.startSurahId &&
          (!nextJuz || surah.id <= nextJuz.startSurahId),
      );
    }

    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return baseSurahs;
    }

    return baseSurahs.filter((surah) =>
      `${surah.id} ${surah.name} ${surah.transliteration} ${surah.translation}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [favoriteSurahIds, query, selectedJuzId, showFavoritesOnly]);

  const selectedSurah = selectedId
    ? surahs.find((surah) => surah.id === selectedId) ?? null
    : null;
  const selectedTranslator =
    quranTranslators.find((translator) => translator.id === selectedTranslatorId) ??
    quranTranslators[0];
  const connectedTranslators = quranTranslators.filter((translator) => translator.source);
  const catalogTranslators = quranTranslators.filter((translator) => !translator.source);
  const selectedJuz = selectedJuzId
    ? quranJuz.find((juz) => juz.id === selectedJuzId) ?? null
    : null;
  const lastReadSurah = lastReadSurahId
    ? surahs.find((surah) => surah.id === lastReadSurahId) ?? null
    : null;
  const isSelectedSurahFavorite = selectedSurah
    ? favoriteSurahIds.includes(selectedSurah.id)
    : false;

  useEffect(() => {
    loadFavoriteSurahIds().then(setFavoriteSurahIds).catch(() => undefined);
    loadLastReadSurahId().then(setLastReadSurahId).catch(() => undefined);
    loadPreferredReciterId()
      .then((reciterId) => {
        if (reciterId && quranReciters.some((reciter) => reciter.id === reciterId)) {
          setSelectedReciterId(reciterId);
        }
      })
      .catch(() => undefined);

    setAudioModeAsync({
      allowsRecording: false,
      interruptionMode: 'duckOthers',
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    savePreferredReciterId(selectedReciterId).catch(() => undefined);
  }, [selectedReciterId]);

  useEffect(() => {
    let isMounted = true;

    setDownloadedAudioUri(null);
    setAudioDownloadMessage(null);

    getDownloadedAudioState(selectedReciterId, selectedAudioSurahId)
      .then((state) => {
        if (isMounted) {
          setDownloadedAudioUri(state.uri);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDownloadedAudioUri(null);
        }
      })

    return () => {
      isMounted = false;
    };
  }, [selectedAudioSurahId, selectedReciterId]);

  useEffect(() => {
    if (selectedSurah) {
      setLastReadSurahId(selectedSurah.id);
      saveLastReadSurahId(selectedSurah.id).catch(() => undefined);
    }
  }, [selectedSurah]);

  const toggleFavoriteSurah = (surahId: number) => {
    setFavoriteSurahIds((currentIds) => {
      const nextIds = currentIds.includes(surahId)
        ? currentIds.filter((id) => id !== surahId)
        : [...currentIds, surahId].sort((a, b) => a - b);

      saveFavoriteSurahIds(nextIds).catch(() => undefined);
      return nextIds;
    });
  };

  const toggleAudio = () => {
    if (!audioUrl) {
      return;
    }

    if (audioStatus.playing) {
      player.pause();
      return;
    }

    if (audioStatus.didJustFinish) {
      player.seekTo(0).catch(() => undefined);
    }

    player.play();
  };

  const replayAudio = () => {
    if (!audioUrl) {
      return;
    }

    player.seekTo(0).then(() => player.play()).catch(() => undefined);
  };

  const openDownloadPanel = (surahId: number) => {
    if (downloadPanelSurahId === surahId) {
      setDownloadPanelSurahId(null);
      return;
    }

    const availableReciters = quranReciters.filter((reciter) => canReciterReadSurah(reciter, surahId));
    const defaultReciterId = availableReciters.some((reciter) => reciter.id === selectedReciterId)
      ? selectedReciterId
      : availableReciters[0]?.id;

    setDownloadPanelSurahId(surahId);
    setDownloadReciterIds(defaultReciterId ? [defaultReciterId] : []);
    setAudioDownloadMessage(null);
  };

  const toggleDownloadReciter = (reciterId: string) => {
    setDownloadReciterIds((currentIds) =>
      currentIds.includes(reciterId)
        ? currentIds.filter((id) => id !== reciterId)
        : [...currentIds, reciterId],
    );
  };

  const downloadSelectedReciters = async () => {
    if (!downloadPanelSurahId || downloadReciterIds.length === 0 || isDownloadingAudio) {
      setAudioDownloadMessage('Sélectionne au moins un récitateur.');
      return;
    }

    const recitersToDownload = quranReciters.filter(
      (reciter) =>
        downloadReciterIds.includes(reciter.id) &&
        canReciterReadSurah(reciter, downloadPanelSurahId),
    );

    if (recitersToDownload.length === 0) {
      setAudioDownloadMessage('Aucun récitateur disponible pour cette sourate.');
      return;
    }

    try {
      let currentSelectionUri: string | null = null;
      setIsDownloadingAudio(true);
      setAudioDownloadMessage('Téléchargement en cours...');
      player.pause();

      for (const reciter of recitersToDownload) {
        const uri = await downloadSurahAudio(reciter, downloadPanelSurahId);
        if (reciter.id === selectedReciterId && downloadPanelSurahId === selectedAudioSurahId) {
          currentSelectionUri = uri;
        }
      }

      if (currentSelectionUri) {
        setDownloadedAudioUri(currentSelectionUri);
      }

      setAudioDownloadMessage(
        recitersToDownload.length === 1
          ? 'Sourate téléchargée pour ce récitateur.'
          : `${recitersToDownload.length} récitations téléchargées.`,
      );
      setDownloadPanelSurahId(null);
    } catch (error) {
      setAudioDownloadMessage(
        error instanceof Error ? error.message : 'Téléchargement impossible pour cette sourate.',
      );
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  const getJuzForSurah = (surahId: number) =>
    quranJuz.filter((juz) => juz.startSurahId === surahId);

  const getJuzForVerse = (surahId: number, verseNumber: number) =>
    quranJuz.filter((juz) => juz.startSurahId === surahId && juz.startVerse === verseNumber);

  const getJuzStartLabel = (juzId: number) => {
    const juz = quranJuz.find((item) => item.id === juzId);
    const surah = juz ? surahs.find((item) => item.id === juz.startSurahId) : null;
    return juz && surah ? `${surah.transliteration} ${juz.startVerse}` : '';
  };

  useEffect(() => {
    let isMounted = true;

    if (!selectedSurah) {
      setArabicVerses([]);
      setArabicError(null);
      return;
    }

    setIsLoadingArabic(true);
    setArabicError(null);
    setArabicVerses(selectedSurah.versesText);

    fetchArabicSurah(selectedSurah.id)
      .then((verses) => {
        if (isMounted) {
          setArabicVerses(verses);
        }
      })
      .catch((error: Error) => {
        if (isMounted) {
          setArabicError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingArabic(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSurah]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedSurah || !showTranslation) {
      setTranslations(new Map());
      setTranslationError(null);
      return;
    }

    setIsLoadingTranslation(true);
    setTranslationError(null);

    fetchTranslationSurah(selectedSurah.id, selectedTranslator, selectedSurah.verses)
      .then((nextTranslations) => {
        if (isMounted) {
          setTranslations(nextTranslations);
        }
      })
      .catch((error: Error) => {
        if (isMounted) {
          setTranslations(new Map());
          setTranslationError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTranslation(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSurah, selectedTranslator, showTranslation]);

  return (
    <Screen
      title="Quran"
      subtitle={
        selectedSurah
          ? 'Lecture en arabe verset par verset, avec traduction française optionnelle.'
          : mode === 'reading'
            ? 'Choisis une sourate ou un juz pour ouvrir la lecture.'
            : 'Préparation de l’espace d’écoute du Quran.'
      }
    >
      <View style={styles.modeTabs}>
        <Pressable
          onPress={() => setMode('reading')}
          style={[styles.modeTab, mode === 'reading' && styles.modeTabActive]}
        >
          <Ionicons
            color={mode === 'reading' ? colors.textInverse : colors.accentSoft}
            name="book"
            size={19}
          />
          <Text style={[styles.modeTabText, mode === 'reading' && styles.modeTabTextActive]}>
            Lecture
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('listening')}
          style={[styles.modeTab, mode === 'listening' && styles.modeTabActive]}
        >
          <Ionicons
            color={mode === 'listening' ? colors.textInverse : colors.accentSoft}
            name="headset"
            size={19}
          />
          <Text
            style={[styles.modeTabText, mode === 'listening' && styles.modeTabTextActive]}
          >
            Écoute
          </Text>
        </Pressable>
      </View>

      {mode === 'listening' ? (
        <>
          <Card tone="primary">
            <View style={styles.audioHeader}>
              <View style={styles.listeningIcon}>
                <Ionicons color={colors.secondary} name="headset" size={28} />
              </View>
              <View style={styles.audioHeaderCopy}>
                <Text style={styles.audioTitle}>{selectedAudioSurah.transliteration}</Text>
                <Text style={styles.audioSubtitle}>
                  {selectedReciter.name} · {selectedReciter.country}
                </Text>
              </View>
            </View>

            <View style={styles.audioControls}>
              <Pressable
                disabled={!audioUrl}
                onPress={toggleAudio}
                style={[styles.audioMainButton, !audioUrl && styles.audioButtonDisabled]}
              >
                <Ionicons
                  color={colors.accentSoft}
                  name={audioStatus.playing ? 'pause' : 'play'}
                  size={30}
                />
              </Pressable>
              <Pressable
                disabled={!audioUrl}
                onPress={replayAudio}
                style={[styles.audioIconButton, !audioUrl && styles.audioButtonDisabled]}
              >
                <Ionicons color={colors.textInverse} name="play-back" size={20} />
              </Pressable>
            </View>

            <Text style={styles.audioStatusText}>
              {!remoteAudioUrl
                ? 'Cette archive ne contient pas cette sourate.'
                : hasOfflineAudio
                  ? audioStatus.playing
                    ? 'Lecture hors ligne en cours'
                    : 'Audio hors ligne disponible'
                : audioStatus.isBuffering
                  ? 'Chargement audio...'
                  : audioStatus.playing
                    ? 'Lecture en cours'
                    : 'Prêt à écouter'}
            </Text>

            {audioDownloadMessage ? (
              <Text style={styles.audioDownloadMessage}>{audioDownloadMessage}</Text>
            ) : null}
          </Card>

          <View style={styles.searchBox}>
            <Ionicons color={colors.muted} name="search" size={20} />
            <TextInput
              onChangeText={(value) => setQuery(value)}
              placeholder="Rechercher une sourate à écouter"
              placeholderTextColor={colors.muted}
              style={styles.search}
              value={query}
            />
          </View>

          <Card>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isReciterMenuOpen }}
              onPress={() => setIsReciterMenuOpen((isOpen) => !isOpen)}
              style={styles.reciterDropdownHeader}
            >
              <View style={styles.reciterIcon}>
                <Ionicons color={colors.accentSoft} name="mic" size={18} />
              </View>
              <View style={styles.reciterCopy}>
                <Text style={styles.catalogTitle}>Récitateur</Text>
                <Text style={styles.reciterNote}>
                  {selectedReciter.name} · {selectedReciter.country}
                </Text>
              </View>
              <Ionicons
                color={colors.accentSoft}
                name={isReciterMenuOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            </Pressable>
            {isReciterMenuOpen ? (
              <View style={styles.reciterList}>
                {quranReciters.map((reciter) => {
                  const isActive = reciter.id === selectedReciterId;
                  return (
                    <Pressable
                      key={reciter.id}
                      onPress={() => {
                        setSelectedReciterId(reciter.id);
                        setIsReciterMenuOpen(false);
                      }}
                      style={[styles.reciterRow, isActive && styles.reciterRowActive]}
                    >
                      <View style={styles.reciterIcon}>
                        <Ionicons
                          color={isActive ? colors.textInverse : colors.accentSoft}
                          name="mic"
                          size={18}
                        />
                      </View>
                      <View style={styles.reciterCopy}>
                        <Text style={[styles.reciterName, isActive && styles.reciterNameActive]}>
                          {reciter.name}
                        </Text>
                        <Text style={[styles.reciterNote, isActive && styles.reciterNoteActive]}>
                          {reciter.country} · {reciter.note}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Card>

          <View style={styles.list}>
            {filteredSurahs.map((surah) => {
              const canRead = canReciterReadSurah(selectedReciter, surah.id);
              const isActive = selectedAudioSurahId === surah.id;
              const isDownloadPanelOpen = downloadPanelSurahId === surah.id;
              const availableDownloadReciters = quranReciters.filter((reciter) =>
                canReciterReadSurah(reciter, surah.id),
              );

              return (
                <View key={surah.id}>
                  <View
                    style={[
                      styles.audioSurahRow,
                      isActive && styles.surahRowActive,
                      !canRead && styles.surahRowDisabled,
                    ]}
                  >
                    <Pressable
                      disabled={!canRead}
                      onPress={() => setSelectedAudioSurahId(surah.id)}
                      style={styles.audioSurahMain}
                    >
                      <Text style={[styles.surahNumber, isActive && styles.activeText]}>
                        {surah.id}
                      </Text>
                      <View style={styles.surahInfo}>
                        <Text style={[styles.surahName, isActive && styles.activeText]}>
                          {surah.transliteration}
                        </Text>
                        <Text
                          style={[styles.surahTranslation, isActive && styles.reciterNoteActive]}
                        >
                          {canRead
                            ? `${surah.verses} versets`
                            : 'Non disponible pour ce récitateur'}
                        </Text>
                      </View>
                      <Ionicons
                        color={isActive ? colors.textInverse : colors.accentSoft}
                        name={isActive ? 'volume-high' : 'play-circle-outline'}
                        size={24}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Télécharger ${surah.transliteration}`}
                      accessibilityRole="button"
                      onPress={() => openDownloadPanel(surah.id)}
                      style={[styles.downloadSurahButton, isDownloadPanelOpen && styles.downloadSurahButtonActive]}
                    >
                      <Ionicons
                        color={isDownloadPanelOpen ? colors.textInverse : colors.accentSoft}
                        name="download-outline"
                        size={20}
                      />
                    </Pressable>
                  </View>

                  {isDownloadPanelOpen ? (
                    <View style={styles.downloadPanel}>
                      <Text style={styles.downloadPanelTitle}>
                        Télécharger {surah.transliteration}
                      </Text>
                      <Text style={styles.downloadPanelText}>
                        Choisis un ou plusieurs récitateurs.
                      </Text>
                      <View style={styles.downloadReciterGrid}>
                        {availableDownloadReciters.map((reciter) => {
                          const isSelected = downloadReciterIds.includes(reciter.id);
                          return (
                            <Pressable
                              key={reciter.id}
                              onPress={() => toggleDownloadReciter(reciter.id)}
                              style={[
                                styles.downloadReciterChip,
                                isSelected && styles.downloadReciterChipSelected,
                              ]}
                            >
                              <Ionicons
                                color={isSelected ? colors.textInverse : colors.accentSoft}
                                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                              />
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.downloadReciterText,
                                  isSelected && styles.downloadReciterTextSelected,
                                ]}
                              >
                                {reciter.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      <Pressable
                        disabled={isDownloadingAudio || downloadReciterIds.length === 0}
                        onPress={downloadSelectedReciters}
                        style={[
                          styles.downloadConfirmButton,
                          (isDownloadingAudio || downloadReciterIds.length === 0) &&
                            styles.audioButtonDisabled,
                        ]}
                      >
                        <Text style={styles.downloadConfirmText}>
                          {isDownloadingAudio ? 'Téléchargement...' : 'Télécharger la sélection'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {mode === 'reading' ? (
        selectedSurah ? (
          <>
          <Pressable onPress={() => setSelectedId(null)} style={styles.backButton}>
            <Ionicons color={colors.accentSoft} name="chevron-back" size={20} />
            <Text style={styles.backButtonText}>Toutes les sourates</Text>
          </Pressable>

          <Card tone="muted">
            <View style={styles.readerHeader}>
              <View style={styles.readerTitleBlock}>
                <Text style={styles.arabic}>{selectedSurah.name}</Text>
                <Text style={styles.selectedTitle}>
                  {selectedSurah.id}. {selectedSurah.transliteration}
                </Text>
                <Text style={styles.muted}>
                  {selectedSurah.translation} - {selectedSurah.verses} versets -{' '}
                  {selectedSurah.revelation}
                </Text>
              </View>
              <View style={styles.surahNumberBadge}>
                <Text style={styles.surahNumberBadgeText}>{selectedSurah.id}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => toggleFavoriteSurah(selectedSurah.id)}
              style={styles.favoriteSurahButton}
            >
              <Ionicons
                color={isSelectedSurahFavorite ? colors.accent : colors.accentSoft}
                name={isSelectedSurahFavorite ? 'star' : 'star-outline'}
                size={19}
              />
              <Text style={styles.favoriteSurahButtonText}>
                {isSelectedSurahFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Text>
            </Pressable>

            <View style={styles.translationControl}>
              <View style={styles.translationCopy}>
                <Text style={styles.translationTitle}>Traduction</Text>
                <Text style={styles.translationSubtitle}>
                  {showTranslation
                    ? selectedTranslator.name
                    : 'Masquée pour garder la lecture arabe pure'}
                </Text>
              </View>
              <Switch
                ios_backgroundColor={colors.borderStrong}
                onValueChange={setShowTranslation}
                thumbColor={showTranslation ? colors.accent : colors.surface}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                value={showTranslation}
              />
            </View>

            {showTranslation ? (
              <View style={styles.translatorPanel}>
                <Text style={styles.translatorPanelTitle}>Sources ouvertes connectées</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.translatorScroller}
                >
                  {connectedTranslators.map((translator) => {
                    const isActive = translator.id === selectedTranslatorId;
                    return (
                      <Pressable
                        key={translator.id}
                        onPress={() => setSelectedTranslatorId(translator.id)}
                        style={[
                          styles.translatorChip,
                          isActive && styles.translatorChipActive,
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.translatorName,
                            isActive && styles.translatorNameActive,
                          ]}
                        >
                          {translator.name}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.translatorNote,
                            isActive && styles.translatorNoteActive,
                          ]}
                        >
                          {translator.note}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={styles.translatorPanelTitle}>Traducteurs connus à sourcer</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.translatorScroller}
                >
                  {catalogTranslators.map((translator) => (
                    <View key={translator.id} style={styles.translatorChipDisabled}>
                      <Text numberOfLines={1} style={styles.translatorNameDisabled}>
                        {translator.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.translatorNote}>
                        {translator.note}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.verses}>
              {isLoadingArabic ? (
                <View style={styles.emptyVersesCard}>
                  <Ionicons color={colors.secondary} name="sync" size={24} />
                  <Text style={styles.emptyVersesTitle}>Chargement du texte arabe</Text>
                  <Text style={styles.emptyVersesText}>
                    Récupération des versets depuis la source Quran ouverte.
                  </Text>
                </View>
              ) : null}

              {arabicError ? (
                <View style={styles.emptyVersesCard}>
                  <Ionicons color={colors.danger} name="alert-circle" size={24} />
                  <Text style={styles.emptyVersesTitle}>Source indisponible</Text>
                  <Text style={styles.emptyVersesText}>{arabicError}</Text>
                </View>
              ) : null}

              {!isLoadingArabic && arabicVerses.length > 0 ? (
                arabicVerses.map((verse) => {
                  const verseJuzMarkers = getJuzForVerse(selectedSurah.id, verse.number);

                  return (
                    <View key={verse.number}>
                      {verseJuzMarkers.map((juz) => (
                        <Pressable
                          key={juz.id}
                          onPress={() => setSelectedJuzId(juz.id)}
                          style={[styles.juzDivider, styles.juzVerseDivider]}
                        >
                          <Text style={styles.juzDividerTitle}>Juz {juz.id}</Text>
                          <Text style={styles.juzDividerMeta}>Débute ici</Text>
                        </Pressable>
                      ))}
                      <View style={styles.verseCard}>
                        <View style={styles.verseMeta}>
                          <Text style={styles.verseNumber}>
                            {selectedSurah.id}:{verse.number}
                          </Text>
                        </View>
                        <Text style={styles.verseArabic}>{verse.arabic}</Text>
                        {showTranslation && isLoadingTranslation ? (
                          <View style={styles.translationPlaceholder}>
                            <Text style={styles.translationPlaceholderTitle}>
                              {selectedTranslator.name}
                            </Text>
                            <Text style={styles.translationPlaceholderText}>
                              Chargement de la traduction…
                            </Text>
                          </View>
                        ) : null}
                        {showTranslation && translationError ? (
                          <View style={styles.translationPlaceholder}>
                            <Text style={styles.translationPlaceholderTitle}>
                              {selectedTranslator.name}
                            </Text>
                            <Text style={styles.translationPlaceholderText}>
                              {translationError}
                            </Text>
                          </View>
                        ) : null}
                        {showTranslation && translations.get(verse.number) ? (
                          <View style={styles.translationPlaceholder}>
                            <Text style={styles.translationPlaceholderTitle}>
                              {selectedTranslator.name}
                            </Text>
                            <Text style={styles.translationPlaceholderText}>
                              {translations.get(verse.number)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyVersesCard}>
                  <Ionicons color={colors.secondary} name="cloud-download" size={24} />
                  <Text style={styles.emptyVersesTitle}>Texte arabe à connecter</Text>
                  <Text style={styles.emptyVersesText}>
                    La sourate est bien référencée dans la liste des 114. La prochaine
                    étape sera de brancher une source Quran complète pour afficher tous
                    les versets arabes.
                  </Text>
                </View>
              )}
            </View>
          </Card>
          </>
      ) : (
          <>
          <View style={styles.searchBox}>
            <Ionicons color={colors.muted} name="search" size={20} />
            <TextInput
              onChangeText={(value) => {
                setQuery(value);
                setSelectedJuzId(null);
              }}
              placeholder="Rechercher une sourate"
              placeholderTextColor={colors.muted}
              style={styles.search}
              value={query}
            />
          </View>

          <View style={styles.quickFilters}>
            {lastReadSurah ? (
              <Pressable onPress={() => setSelectedId(lastReadSurah.id)} style={styles.quickFilter}>
                <Ionicons color={colors.secondary} name="bookmark" size={16} />
                <Text style={styles.quickFilterText}>Dernière lecture : {lastReadSurah.transliteration}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setShowFavoritesOnly((value) => !value)}
              style={[styles.quickFilter, showFavoritesOnly && styles.quickFilterActive]}
            >
              <Ionicons
                color={showFavoritesOnly ? colors.textInverse : colors.secondary}
                name="star"
                size={16}
              />
              <Text style={[styles.quickFilterText, showFavoritesOnly && styles.quickFilterTextActive]}>
                Favoris
              </Text>
            </Pressable>
          </View>

          <View style={styles.juzSection}>
            <View style={styles.juzHeader}>
              <Text style={styles.juzTitle}>Navigation par juz</Text>
              {selectedJuzId ? (
                <Pressable onPress={() => setSelectedJuzId(null)}>
                  <Text style={styles.clearJuz}>Tout afficher</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.juzScroller}
            >
              {quranJuz.map((juz) => {
                const isActive = selectedJuzId === juz.id;
                return (
                  <Pressable
                    key={juz.id}
                    onPress={() => {
                      setQuery('');
                      setSelectedJuzId(juz.id);
                    }}
                    style={[styles.juzChip, isActive && styles.juzChipActive]}
                  >
                    <Text style={[styles.juzChipTitle, isActive && styles.juzChipTitleActive]}>
                      Juz {juz.id}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.juzChipMeta, isActive && styles.juzChipMetaActive]}
                    >
                      {getJuzStartLabel(juz.id)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {selectedJuz ? (
            <Card tone="muted">
              <Text style={styles.catalogTitle}>Juz {selectedJuz.id}</Text>
              <Text style={styles.catalogText}>
                Début : {getJuzStartLabel(selectedJuz.id)}. Les sourates affichées
                couvrent cette zone de lecture.
              </Text>
            </Card>
          ) : null}

          <Card tone="accent">
            <Text style={styles.catalogTitle}>114 sourates</Text>
            <Text style={styles.catalogText}>
              Sélectionne une sourate pour ouvrir la lecture en arabe, verset par
              verset.
            </Text>
          </Card>

          <View style={styles.list}>
            {filteredSurahs.map((surah) => (
              <View key={surah.id}>
                {getJuzForSurah(surah.id).map((juz) => (
                  <Pressable
                    key={juz.id}
                    onPress={() => {
                      setQuery('');
                      setSelectedJuzId(juz.id);
                    }}
                    style={styles.juzDivider}
                  >
                    <Text style={styles.juzDividerTitle}>Juz {juz.id}</Text>
                    <Text style={styles.juzDividerMeta}>
                      Débute à {surah.transliteration} {juz.startVerse}
                    </Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setSelectedId(surah.id)} style={styles.surahRow}>
                  <Text style={styles.surahNumber}>{surah.id}</Text>
                  <View style={styles.surahInfo}>
                    <Text style={styles.surahName}>{surah.transliteration}</Text>
                    <Text style={styles.surahTranslation}>
                      {surah.translation} - {surah.verses} versets
                    </Text>
                  </View>
                  <Text style={styles.surahArabic}>{surah.name}</Text>
                  <Pressable
                    onPress={() => toggleFavoriteSurah(surah.id)}
                    style={styles.favoriteListButton}
                  >
                    <Ionicons
                      color={favoriteSurahIds.includes(surah.id) ? colors.accent : colors.muted}
                      name={favoriteSurahIds.includes(surah.id) ? 'star' : 'star-outline'}
                      size={18}
                    />
                  </Pressable>
                </Pressable>
              </View>
            ))}
          </View>
          </>
        )
      ) : null}
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  modeTabs: {
    backgroundColor: colors.chromeSoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.xs,
  },
  modeTab: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    color: colors.accentSoft,
    fontSize: 14,
    fontWeight: '900',
  },
  modeTabTextActive: {
    color: colors.textInverse,
  },
  listeningIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 56,
  },
  audioHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  audioHeaderCopy: {
    flex: 1,
  },
  audioTitle: {
    color: colors.textInverse,
    fontSize: 24,
    fontWeight: '900',
  },
  audioSubtitle: {
    color: colors.mutedInverse,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 3,
  },
  audioControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  audioMainButton: {
    alignItems: 'center',
    backgroundColor: colors.textInverse,
    borderRadius: radius.pill,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  audioIconButton: {
    alignItems: 'center',
    backgroundColor: colors.chrome,
    borderColor: colors.chromeMore,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  audioButtonDisabled: {
    opacity: 0.42,
  },
  audioStatusText: {
    color: colors.mutedInverse,
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  offlineAudioPanel: {
    alignItems: 'center',
    backgroundColor: colors.chromeSoft,
    borderColor: colors.chromeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  offlineAudioCopy: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  offlineAudioText: {
    color: colors.mutedInverse,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  offlineAudioButton: {
    alignItems: 'center',
    backgroundColor: colors.textInverse,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  offlineAudioButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  audioDownloadMessage: {
    color: colors.mutedInverse,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  reciterDropdownHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  reciterList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reciterRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  reciterRowActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reciterIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  reciterCopy: {
    flex: 1,
  },
  reciterName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  reciterNameActive: {
    color: colors.textInverse,
  },
  reciterNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  reciterNoteActive: {
    color: colors.mutedInverse,
  },
  juzSection: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  juzHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  juzTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  clearJuz: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  juzScroller: {
    paddingHorizontal: spacing.md,
  },
  juzChip: {
    backgroundColor: colors.chromeFaint,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginRight: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 118,
  },
  juzChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  juzChipTitle: {
    color: colors.accentSoft,
    fontSize: 15,
    fontWeight: '900',
  },
  juzChipTitleActive: {
    color: colors.textInverse,
  },
  juzChipMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  juzChipMetaActive: {
    color: colors.mutedInverse,
  },
  juzDivider: {
    alignItems: 'center',
    backgroundColor: colors.primaryWashStrong,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  juzDividerTitle: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '900',
  },
  juzDividerMeta: {
    color: colors.mutedInverse,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  juzVerseDivider: {
    marginTop: 0,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  search: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickFilter: {
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickFilterText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  quickFilterTextActive: {
    color: colors.textInverse,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.chrome,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.accentSoft,
    fontSize: 14,
    fontWeight: '900',
  },
  catalogTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  catalogText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  readerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  readerTitleBlock: {
    flex: 1,
  },
  arabic: {
    color: colors.accentSoft,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  selectedTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  surahNumberBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  surahNumberBadgeText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '900',
  },
  favoriteSurahButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.chromeSoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  favoriteSurahButtonText: {
    color: colors.accentSoft,
    fontSize: 13,
    fontWeight: '900',
  },
  translationControl: {
    alignItems: 'center',
    backgroundColor: colors.chromeSoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  translationCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  translationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  translationSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  translatorPanel: {
    marginTop: spacing.md,
  },
  translatorPanelTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  translatorScroller: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  translatorChip: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 178,
  },
  translatorChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  translatorName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  translatorNameActive: {
    color: colors.textInverse,
  },
  translatorNote: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  translatorNoteActive: {
    color: colors.mutedInverse,
  },
  translatorChipDisabled: {
    backgroundColor: colors.chromeFaint,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginRight: spacing.sm,
    opacity: 0.62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 178,
  },
  translatorNameDisabled: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  verses: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  verseCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  verseMeta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  verseNumber: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  verseArabic: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 52,
    textAlign: 'right',
  },
  translationPlaceholder: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  translationPlaceholderTitle: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  translationPlaceholderText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  emptyVersesCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyVersesTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  emptyVersesText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  audioSurahRow: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  audioSurahMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 54,
  },
  downloadSurahButton: {
    alignItems: 'center',
    backgroundColor: colors.chromeSoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  downloadSurahButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  downloadPanel: {
    backgroundColor: colors.panelSolid,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  downloadPanelTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  downloadPanelText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  downloadReciterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  downloadReciterChip: {
    alignItems: 'center',
    backgroundColor: colors.chromeFaint,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  downloadReciterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  downloadReciterText: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    maxWidth: 220,
  },
  downloadReciterTextSelected: {
    color: colors.textInverse,
  },
  downloadConfirmButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  downloadConfirmText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '900',
  },
  surahRow: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  surahRowActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  surahRowDisabled: {
    opacity: 0.48,
  },
  surahNumber: {
    color: colors.accentSoft,
    fontSize: 15,
    fontWeight: '900',
    width: 30,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  surahTranslation: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  surahArabic: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  favoriteListButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  activeText: {
    color: colors.textInverse,
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
