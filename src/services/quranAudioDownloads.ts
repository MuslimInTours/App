import * as FileSystem from 'expo-file-system/legacy';

import { buildSurahAudioUrl, QuranReciter } from '../data/quranAudio';

export type AudioDownloadState = {
  exists: boolean;
  uri: string | null;
};

const AUDIO_DIRECTORY = `${FileSystem.documentDirectory ?? ''}quran-audio/`;

const buildAudioFilename = (reciterId: string, surahId: number) =>
  `${reciterId}-${surahId.toString().padStart(3, '0')}.mp3`;

export const buildDownloadedAudioUri = (reciterId: string, surahId: number) =>
  `${AUDIO_DIRECTORY}${buildAudioFilename(reciterId, surahId)}`;

async function ensureAudioDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Le stockage local n'est pas disponible sur cet appareil.");
  }

  const info = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
  }
}

export async function getDownloadedAudioState(
  reciterId: string,
  surahId: number,
): Promise<AudioDownloadState> {
  if (!FileSystem.documentDirectory) {
    return { exists: false, uri: null };
  }

  const uri = buildDownloadedAudioUri(reciterId, surahId);
  const info = await FileSystem.getInfoAsync(uri);
  return {
    exists: info.exists,
    uri: info.exists ? uri : null,
  };
}

export async function downloadSurahAudio(reciter: QuranReciter, surahId: number) {
  await ensureAudioDirectory();

  const localUri = buildDownloadedAudioUri(reciter.id, surahId);
  const existing = await FileSystem.getInfoAsync(localUri);
  if (existing.exists) {
    return localUri;
  }

  const result = await FileSystem.downloadAsync(buildSurahAudioUrl(reciter, surahId), localUri);
  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
    throw new Error(`Téléchargement impossible (${result.status}).`);
  }

  return result.uri;
}

export async function deleteDownloadedSurahAudio(reciterId: string, surahId: number) {
  if (!FileSystem.documentDirectory) {
    return;
  }

  await FileSystem.deleteAsync(buildDownloadedAudioUri(reciterId, surahId), {
    idempotent: true,
  });
}
