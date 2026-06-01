export type QuranVerse = {
  number: number;
  arabic: string;
  translationPreview?: string;
};

export type Surah = {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  verses: number;
  revelation: 'Mecquoise' | 'Medinoise';
  versesText: QuranVerse[];
};

export type QuranJuz = {
  id: number;
  startSurahId: number;
  startVerse: number;
};

export const quranJuz: QuranJuz[] = [
  { id: 1, startSurahId: 1, startVerse: 1 },
  { id: 2, startSurahId: 2, startVerse: 142 },
  { id: 3, startSurahId: 2, startVerse: 253 },
  { id: 4, startSurahId: 3, startVerse: 93 },
  { id: 5, startSurahId: 4, startVerse: 24 },
  { id: 6, startSurahId: 4, startVerse: 148 },
  { id: 7, startSurahId: 5, startVerse: 82 },
  { id: 8, startSurahId: 6, startVerse: 111 },
  { id: 9, startSurahId: 7, startVerse: 88 },
  { id: 10, startSurahId: 8, startVerse: 41 },
  { id: 11, startSurahId: 9, startVerse: 93 },
  { id: 12, startSurahId: 11, startVerse: 6 },
  { id: 13, startSurahId: 12, startVerse: 53 },
  { id: 14, startSurahId: 15, startVerse: 1 },
  { id: 15, startSurahId: 17, startVerse: 1 },
  { id: 16, startSurahId: 18, startVerse: 75 },
  { id: 17, startSurahId: 21, startVerse: 1 },
  { id: 18, startSurahId: 23, startVerse: 1 },
  { id: 19, startSurahId: 25, startVerse: 21 },
  { id: 20, startSurahId: 27, startVerse: 56 },
  { id: 21, startSurahId: 29, startVerse: 46 },
  { id: 22, startSurahId: 33, startVerse: 31 },
  { id: 23, startSurahId: 36, startVerse: 28 },
  { id: 24, startSurahId: 39, startVerse: 32 },
  { id: 25, startSurahId: 41, startVerse: 47 },
  { id: 26, startSurahId: 46, startVerse: 1 },
  { id: 27, startSurahId: 51, startVerse: 31 },
  { id: 28, startSurahId: 58, startVerse: 1 },
  { id: 29, startSurahId: 67, startVerse: 1 },
  { id: 30, startSurahId: 78, startVerse: 1 },
];

const surahRows: Array<
  [number, string, string, string, number, 'Mecquoise' | 'Medinoise']
> = [
  [1, 'الفاتحة', 'Al-Fatiha', 'L’ouverture', 7, 'Mecquoise'],
  [2, 'البقرة', 'Al-Baqara', 'La vache', 286, 'Medinoise'],
  [3, 'آل عمران', 'Ali Imran', 'La famille d Imran', 200, 'Medinoise'],
  [4, 'النساء', 'An-Nisa', 'Les femmes', 176, 'Medinoise'],
  [5, 'المائدة', 'Al-Maida', 'La table servie', 120, 'Medinoise'],
  [6, 'الأنعام', 'Al-Anam', 'Les bestiaux', 165, 'Mecquoise'],
  [7, 'الأعراف', 'Al-Araf', 'Les hauteurs', 206, 'Mecquoise'],
  [8, 'الأنفال', 'Al-Anfal', 'Le butin', 75, 'Medinoise'],
  [9, 'التوبة', 'At-Tawba', 'Le repentir', 129, 'Medinoise'],
  [10, 'يونس', 'Yunus', 'Jonas', 109, 'Mecquoise'],
  [11, 'هود', 'Hud', 'Hud', 123, 'Mecquoise'],
  [12, 'يوسف', 'Yusuf', 'Joseph', 111, 'Mecquoise'],
  [13, 'الرعد', 'Ar-Rad', 'Le tonnerre', 43, 'Medinoise'],
  [14, 'إبراهيم', 'Ibrahim', 'Abraham', 52, 'Mecquoise'],
  [15, 'الحجر', 'Al-Hijr', 'Al-Hijr', 99, 'Mecquoise'],
  [16, 'النحل', 'An-Nahl', 'Les abeilles', 128, 'Mecquoise'],
  [17, 'الإسراء', 'Al-Isra', 'Le voyage nocturne', 111, 'Mecquoise'],
  [18, 'الكهف', 'Al-Kahf', 'La caverne', 110, 'Mecquoise'],
  [19, 'مريم', 'Maryam', 'Marie', 98, 'Mecquoise'],
  [20, 'طه', 'Taha', 'Ta-Ha', 135, 'Mecquoise'],
  [21, 'الأنبياء', 'Al-Anbiya', 'Les prophètes', 112, 'Mecquoise'],
  [22, 'الحج', 'Al-Hajj', 'Le pèlerinage', 78, 'Medinoise'],
  [23, 'المؤمنون', 'Al-Muminun', 'Les croyants', 118, 'Mecquoise'],
  [24, 'النور', 'An-Nur', 'La lumière', 64, 'Medinoise'],
  [25, 'الفرقان', 'Al-Furqan', 'Le discernement', 77, 'Mecquoise'],
  [26, 'الشعراء', 'Ash-Shuara', 'Les poètes', 227, 'Mecquoise'],
  [27, 'النمل', 'An-Naml', 'Les fourmis', 93, 'Mecquoise'],
  [28, 'القصص', 'Al-Qasas', 'Le récit', 88, 'Mecquoise'],
  [29, 'العنكبوت', 'Al-Ankabut', 'L’araignée', 69, 'Mecquoise'],
  [30, 'الروم', 'Ar-Rum', 'Les romains', 60, 'Mecquoise'],
  [31, 'لقمان', 'Luqman', 'Luqman', 34, 'Mecquoise'],
  [32, 'السجدة', 'As-Sajda', 'La prosternation', 30, 'Mecquoise'],
  [33, 'الأحزاب', 'Al-Ahzab', 'Les coalises', 73, 'Medinoise'],
  [34, 'سبأ', 'Saba', 'Saba', 54, 'Mecquoise'],
  [35, 'فاطر', 'Fatir', 'Le créateur', 45, 'Mecquoise'],
  [36, 'يس', 'Ya-Sin', 'Ya-Sin', 83, 'Mecquoise'],
  [37, 'الصافات', 'As-Saffat', 'Les rangés', 182, 'Mecquoise'],
  [38, 'ص', 'Sad', 'Sad', 88, 'Mecquoise'],
  [39, 'الزمر', 'Az-Zumar', 'Les groupes', 75, 'Mecquoise'],
  [40, 'غافر', 'Ghafir', 'Le pardonneur', 85, 'Mecquoise'],
  [41, 'فصلت', 'Fussilat', 'Les versets détaillés', 54, 'Mecquoise'],
  [42, 'الشورى', 'Ash-Shura', 'La consultation', 53, 'Mecquoise'],
  [43, 'الزخرف', 'Az-Zukhruf', 'L’ornement', 89, 'Mecquoise'],
  [44, 'الدخان', 'Ad-Dukhan', 'La fumée', 59, 'Mecquoise'],
  [45, 'الجاثية', 'Al-Jathiya', 'L’agenouillée', 37, 'Mecquoise'],
  [46, 'الأحقاف', 'Al-Ahqaf', 'Al-Ahqaf', 35, 'Mecquoise'],
  [47, 'محمد', 'Muhammad', 'Muhammad', 38, 'Medinoise'],
  [48, 'الفتح', 'Al-Fath', 'La victoire', 29, 'Medinoise'],
  [49, 'الحجرات', 'Al-Hujurat', 'Les appartements', 18, 'Medinoise'],
  [50, 'ق', 'Qaf', 'Qaf', 45, 'Mecquoise'],
  [51, 'الذاريات', 'Adh-Dhariyat', 'Qui eparpillent', 60, 'Mecquoise'],
  [52, 'الطور', 'At-Tur', 'Le mont', 49, 'Mecquoise'],
  [53, 'النجم', 'An-Najm', 'L’étoile', 62, 'Mecquoise'],
  [54, 'القمر', 'Al-Qamar', 'La lune', 55, 'Mecquoise'],
  [55, 'الرحمن', 'Ar-Rahman', 'Le tout misericordieux', 78, 'Medinoise'],
  [56, 'الواقعة', 'Al-Waqia', 'L’événement', 96, 'Mecquoise'],
  [57, 'الحديد', 'Al-Hadid', 'Le fer', 29, 'Medinoise'],
  [58, 'المجادلة', 'Al-Mujadila', 'La discussion', 22, 'Medinoise'],
  [59, 'الحشر', 'Al-Hashr', 'L’exode', 24, 'Medinoise'],
  [60, 'الممتحنة', 'Al-Mumtahana', 'L’éprouvée', 13, 'Medinoise'],
  [61, 'الصف', 'As-Saff', 'Le rang', 14, 'Medinoise'],
  [62, 'الجمعة', 'Al-Jumua', 'Le vendredi', 11, 'Medinoise'],
  [63, 'المنافقون', 'Al-Munafiqun', 'Les hypocrites', 11, 'Medinoise'],
  [64, 'التغابن', 'At-Taghabun', 'La grande perte', 18, 'Medinoise'],
  [65, 'الطلاق', 'At-Talaq', 'Le divorce', 12, 'Medinoise'],
  [66, 'التحريم', 'At-Tahrim', 'L interdiction', 12, 'Medinoise'],
  [67, 'الملك', 'Al-Mulk', 'La royauté', 30, 'Mecquoise'],
  [68, 'القلم', 'Al-Qalam', 'La plume', 52, 'Mecquoise'],
  [69, 'الحاقة', 'Al-Haqqa', 'Celle qui montre la vérité', 52, 'Mecquoise'],
  [70, 'المعارج', 'Al-Maarij', 'Les voies d’ascension', 44, 'Mecquoise'],
  [71, 'نوح', 'Nuh', 'Noé', 28, 'Mecquoise'],
  [72, 'الجن', 'Al-Jinn', 'Les djinns', 28, 'Mecquoise'],
  [73, 'المزمل', 'Al-Muzzammil', 'L’enveloppé', 20, 'Mecquoise'],
  [74, 'المدثر', 'Al-Muddaththir', 'Le revêtu d’un manteau', 56, 'Mecquoise'],
  [75, 'القيامة', 'Al-Qiyama', 'La résurrection', 40, 'Mecquoise'],
  [76, 'الإنسان', 'Al-Insan', 'L homme', 31, 'Medinoise'],
  [77, 'المرسلات', 'Al-Mursalat', 'Les envoyes', 50, 'Mecquoise'],
  [78, 'النبأ', 'An-Naba', 'La nouvelle', 40, 'Mecquoise'],
  [79, 'النازعات', 'An-Naziat', 'Les anges qui arrachent', 46, 'Mecquoise'],
  [80, 'عبس', 'Abasa', 'Il s est renfrogne', 42, 'Mecquoise'],
  [81, 'التكوير', 'At-Takwir', 'L’obscurcissement', 29, 'Mecquoise'],
  [82, 'الانفطار', 'Al-Infitar', 'La rupture', 19, 'Mecquoise'],
  [83, 'المطففين', 'Al-Mutaffifin', 'Les fraudeurs', 36, 'Mecquoise'],
  [84, 'الانشقاق', 'Al-Inshiqaq', 'La déchirure', 25, 'Mecquoise'],
  [85, 'البروج', 'Al-Buruj', 'Les constellations', 22, 'Mecquoise'],
  [86, 'الطارق', 'At-Tariq', 'L’astre nocturne', 17, 'Mecquoise'],
  [87, 'الأعلى', 'Al-Ala', 'Le très-haut', 19, 'Mecquoise'],
  [88, 'الغاشية', 'Al-Ghashiya', 'L enveloppante', 26, 'Mecquoise'],
  [89, 'الفجر', 'Al-Fajr', 'L’aube', 30, 'Mecquoise'],
  [90, 'البلد', 'Al-Balad', 'La cité', 20, 'Mecquoise'],
  [91, 'الشمس', 'Ash-Shams', 'Le soleil', 15, 'Mecquoise'],
  [92, 'الليل', 'Al-Layl', 'La nuit', 21, 'Mecquoise'],
  [93, 'الضحى', 'Ad-Duha', 'Le jour montant', 11, 'Mecquoise'],
  [94, 'الشرح', 'Ash-Sharh', 'L’ouverture', 8, 'Mecquoise'],
  [95, 'التين', 'At-Tin', 'Le figuier', 8, 'Mecquoise'],
  [96, 'العلق', 'Al-Alaq', 'L’adhérence', 19, 'Mecquoise'],
  [97, 'القدر', 'Al-Qadr', 'La destinée', 5, 'Mecquoise'],
  [98, 'البينة', 'Al-Bayyina', 'La preuve', 8, 'Medinoise'],
  [99, 'الزلزلة', 'Az-Zalzala', 'La secousse', 8, 'Medinoise'],
  [100, 'العاديات', 'Al-Adiyat', 'Les coursiers', 11, 'Mecquoise'],
  [101, 'القارعة', 'Al-Qaria', 'Le fracas', 11, 'Mecquoise'],
  [102, 'التكاثر', 'At-Takathur', 'La course aux richesses', 8, 'Mecquoise'],
  [103, 'العصر', 'Al-Asr', 'Le temps', 3, 'Mecquoise'],
  [104, 'الهمزة', 'Al-Humaza', 'Les calomniateurs', 9, 'Mecquoise'],
  [105, 'الفيل', 'Al-Fil', 'L’éléphant', 5, 'Mecquoise'],
  [106, 'قريش', 'Quraysh', 'Quraysh', 4, 'Mecquoise'],
  [107, 'الماعون', 'Al-Maun', 'L ustensile', 7, 'Mecquoise'],
  [108, 'الكوثر', 'Al-Kawthar', 'L’abondance', 3, 'Mecquoise'],
  [109, 'الكافرون', 'Al-Kafirun', 'Les infidèles', 6, 'Mecquoise'],
  [110, 'النصر', 'An-Nasr', 'Le secours', 3, 'Medinoise'],
  [111, 'المسد', 'Al-Masad', 'Les fibres', 5, 'Mecquoise'],
  [112, 'الإخلاص', 'Al-Ikhlas', 'Le monothéisme pur', 4, 'Mecquoise'],
  [113, 'الفلق', 'Al-Falaq', 'L’aube naissante', 5, 'Mecquoise'],
  [114, 'الناس', 'An-Nas', 'Les hommes', 6, 'Mecquoise'],
];

const versesBySurah: Record<number, QuranVerse[]> = {
  1: [
    { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
    { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
    { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ' },
    { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ' },
    { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
    {
      number: 7,
      arabic:
        'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    },
  ],
  2: [
    { number: 1, arabic: 'الم' },
    {
      number: 2,
      arabic: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ',
    },
    {
      number: 3,
      arabic:
        'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ',
    },
  ],
  18: [
    {
      number: 1,
      arabic:
        'الْحَمْدُ لِلَّهِ الَّذِي أَنْزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا',
    },
    {
      number: 2,
      arabic:
        'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ',
    },
  ],
  36: [
    { number: 1, arabic: 'يس' },
    { number: 2, arabic: 'وَالْقُرْآنِ الْحَكِيمِ' },
    { number: 3, arabic: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ' },
  ],
  112: [
    { number: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ' },
    { number: 2, arabic: 'اللَّهُ الصَّمَدُ' },
    { number: 3, arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
    { number: 4, arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ' },
  ],
};

export const surahs: Surah[] = surahRows.map(
  ([id, name, transliteration, translation, verses, revelation]) => ({
    id,
    name,
    transliteration,
    translation,
    verses,
    revelation,
    versesText: versesBySurah[id] ?? [],
  }),
);

export type QuranTranslator = {
  id: string;
  name: string;
  note: string;
  source?:
    | {
        provider: 'fawaz-quran-api';
        edition: string;
        url: string;
      }
    | {
        provider: 'quranpedia';
        bookId: number;
        url: string;
      };
};

export const quranTranslators: QuranTranslator[] = [
  {
    id: 'rashid-maash',
    name: 'Rashid Maash',
    note: 'source ouverte connectée',
    source: {
      provider: 'fawaz-quran-api',
      edition: 'fra-rashidmaash',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/fra-rashidmaash.min.json',
    },
  },
  {
    id: 'hamidullah',
    name: 'Muhammad Hamidullah',
    note: 'source ouverte connectée',
    source: {
      provider: 'fawaz-quran-api',
      edition: 'fra-muhammadhamidul',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/fra-muhammadhamidul.min.json',
    },
  },
  {
    id: 'hameedullah-quranenc',
    name: 'Muhammad Hameedullah',
    note: 'source QuranEnc connectée',
    source: {
      provider: 'fawaz-quran-api',
      edition: 'fra-muhammadhameedu',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/fra-muhammadhameedu.min.json',
    },
  },
  {
    id: 'islamic-foundation',
    name: 'Islamic Foundation',
    note: 'source QuranEnc connectée',
    source: {
      provider: 'fawaz-quran-api',
      edition: 'fra-islamicfoundati',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/fra-islamicfoundati.min.json',
    },
  },
  {
    id: 'shahnaz-saidi-benbetka',
    name: 'Shahnaz Saidi Benbetka',
    note: 'source ouverte connectée',
    source: {
      provider: 'fawaz-quran-api',
      edition: 'fra-shahnazsaidiben',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/fra-shahnazsaidiben.min.json',
    },
  },
  {
    id: 'quranpedia-montada',
    name: 'Nabil Ridwan',
    note: 'Quranpedia disponible',
    source: {
      provider: 'quranpedia',
      bookId: 1949,
      url: 'https://api.quranpedia.net/v1/translations',
    },
  },
  {
    id: 'quranpedia-mukhtasar',
    name: 'Tafsir Center',
    note: 'Quranpedia disponible',
    source: {
      provider: 'quranpedia',
      bookId: 2005,
      url: 'https://api.quranpedia.net/v1/translations',
    },
  },
  { id: 'kazimirski', name: 'Albin de B. Kazimirski', note: 'à sourcer légalement' },
  { id: 'denise-masson', name: 'Denise Masson', note: 'édition La Pleiade' },
  { id: 'regis-blachere', name: 'Regis Blachere', note: 'approche universitaire' },
  { id: 'jacques-berque', name: 'Jacques Berque', note: 'style littéraire' },
  { id: 'malek-chebel', name: 'Malek Chebel', note: 'lecture contemporaine' },
  { id: 'andre-chouraqui', name: 'Andre Chouraqui', note: 'langue sémitique' },
  { id: 'hamza-boubakeur', name: 'Hamza Boubakeur', note: 'commentaires religieux' },
  { id: 'mohammed-chiadmi', name: 'Mohammed Chiadmi', note: 'français accessible' },
  { id: 'jean-louis-michon', name: 'Jean-Louis Michon', note: 'sens spirituel' },
  { id: 'zeinab-abdelaziz', name: 'Zeinab Abdelaziz', note: 'à sourcer légalement' },
  { id: 'gilles-valois', name: 'Gilles Valois', note: 'à sourcer légalement' },
  { id: 'jean-grosjean', name: 'Jean Grosjean', note: 'à sourcer légalement' },
  { id: 'edouard-montet', name: 'Edouard Montet', note: 'à sourcer légalement' },
  { id: 'claude-savary', name: 'Claude-Etienne Savary', note: 'historique' },
  { id: 'andre-du-ryer', name: 'Andre Du Ryer', note: 'première traduction française' },
  { id: 'ameur-ghedira', name: 'Ameur Ghedira', note: 'traduction francophone' },
  { id: 'sadok-mazigh', name: 'Sadok Mazigh', note: 'édition francophone' },
  { id: 'abdallah-penot', name: 'Abdallah Penot', note: 'traduction contemporaine' },
  { id: 'sami-aldeeb', name: 'Sami Aldeeb', note: 'édition comparée' },
];
