export type QuranReciter = {
  country: string;
  id: string;
  name: string;
  note: string;
  server: string;
  surahList?: number[];
};

export const quranReciters: QuranReciter[] = [
  {
    country: 'Koweït',
    id: 'mishary-afasy',
    name: 'Mishary Rashid Al-Afasy',
    note: 'Voix douce et mélodieuse, très connue mondialement.',
    server: 'https://server8.mp3quran.net/afs/',
  },
  {
    country: 'Arabie saoudite',
    id: 'sudais',
    name: 'Abdul Rahman Al-Sudais',
    note: 'Imam de la Grande Mosquée de La Mecque.',
    server: 'https://server11.mp3quran.net/sds/',
  },
  {
    country: 'Arabie saoudite',
    id: 'shuraim',
    name: 'Saud Al-Shuraim',
    note: 'Ancien imam de La Mecque, récitation puissante.',
    server: 'https://server7.mp3quran.net/shur/',
  },
  {
    country: 'Arabie saoudite',
    id: 'muaiqly',
    name: 'Maher Al-Muaiqly',
    note: 'Imam de La Mecque, voix très appréciée.',
    server: 'https://server12.mp3quran.net/maher/',
  },
  {
    country: 'Arabie saoudite',
    id: 'yasser-dosari',
    name: 'Yasser Al-Dosari',
    note: 'Récitation très émotionnelle.',
    server: 'https://server11.mp3quran.net/yasser/',
  },
  {
    country: 'Arabie saoudite',
    id: 'juhany',
    name: 'Abdullah Al-Juhany',
    note: 'Imam de La Mecque.',
    server: 'https://server13.mp3quran.net/jhn/',
  },
  {
    country: 'Arabie saoudite',
    id: 'bandar-balilah',
    name: 'Bandar Baleela',
    note: 'Voix posée et profonde.',
    server: 'https://server6.mp3quran.net/balilah/',
  },
  {
    country: 'Arabie saoudite',
    id: 'ali-jaber',
    name: 'Ali Jaber',
    note: 'Grande figure de la récitation du Haram.',
    server: 'https://server11.mp3quran.net/a_jbr/',
  },
  {
    country: 'Égypte',
    id: 'abdul-basit',
    name: 'Abdul Basit Abdus-Samad',
    note: 'L’un des plus célèbres de l’histoire.',
    server: 'https://server7.mp3quran.net/basit/',
  },
  {
    country: 'Égypte',
    id: 'minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    note: 'Récitation humble et bouleversante.',
    server: 'https://server10.mp3quran.net/minsh/',
  },
  {
    country: 'Égypte',
    id: 'husary-hafs',
    name: 'Mahmoud Khalil Al-Husary',
    note: 'Référence majeure du tajwid, version Hafs.',
    server: 'https://server13.mp3quran.net/husr/',
  },
  {
    country: 'Égypte',
    id: 'mustafa-ismail',
    name: 'Mustafa Ismail',
    note: 'Maître de la récitation égyptienne classique.',
    server: 'https://server8.mp3quran.net/mustafa/',
  },
  {
    country: 'Égypte',
    id: 'mohamed-rifaat',
    name: 'Mohamed Rifaat',
    note: 'Figure historique, archives disponibles selon sourates.',
    server: 'https://server14.mp3quran.net/refat/',
    surahList: [1, 10, 11, 12, 17, 18, 19, 20, 48, 54, 55, 56, 69, 72, 73, 75, 76, 77, 78, 79, 81, 82, 83, 85, 86, 87, 88, 89, 96, 98, 100],
  },
  {
    country: 'Arabie saoudite',
    id: 'shatri',
    name: 'Abu Bakr Al-Shatri',
    note: 'Voix calme et fluide.',
    server: 'https://server11.mp3quran.net/shatri/',
  },
  {
    country: 'Arabie saoudite',
    id: 'qatami',
    name: 'Nasser Al-Qatami',
    note: 'Récitation émotive, très écoutée.',
    server: 'https://server6.mp3quran.net/qtm/',
  },
  {
    country: 'Arabie saoudite',
    id: 'idris-abkar',
    name: 'Idris Abkar',
    note: 'Voix très expressive.',
    server: 'https://server6.mp3quran.net/abkr/',
  },
  {
    country: 'Émirats arabes unis',
    id: 'bukhatir',
    name: 'Salah Bukhatir',
    note: 'Récitation douce et très connue.',
    server: 'https://server8.mp3quran.net/bu_khtr/',
  },
  {
    country: 'Arabie saoudite',
    id: 'ajmi',
    name: 'Ahmed Al-Ajmi',
    note: 'Voix reconnaissable et populaire.',
    server: 'https://server10.mp3quran.net/ajm/',
  },
  {
    country: 'Yémen',
    id: 'fares-abbad',
    name: 'Fares Abbad',
    note: 'Très écouté pour l’apprentissage.',
    server: 'https://server8.mp3quran.net/frs_a/',
  },
  {
    country: 'Égypte',
    id: 'husary-warsh',
    name: 'Khalil Al-Husary - Warsh / Qalun',
    note: 'Référence pédagogique pour la rigueur de lecture.',
    server: 'https://server13.mp3quran.net/husr/Rewayat-Qalon-A-n-Nafi/',
  },
];

export function buildSurahAudioUrl(reciter: QuranReciter, surahId: number) {
  const paddedSurahId = surahId.toString().padStart(3, '0');
  return `${reciter.server}${paddedSurahId}.mp3`;
}

export function canReciterReadSurah(reciter: QuranReciter, surahId: number) {
  return !reciter.surahList || reciter.surahList.includes(surahId);
}
