export type Prayer = {
  name: string;
  time: string;
};

export const toursCoordinates = {
  latitude: 47.3941,
  longitude: 0.6848,
};

export const prayersToday: Prayer[] = [
  { name: 'Fajr', time: '04:42' },
  { name: 'Dhuhr', time: '13:55' },
  { name: 'Asr', time: '18:03' },
  { name: 'Maghrib', time: '21:42' },
  { name: 'Isha', time: '23:18' },
];

export const iqamaTimes: Prayer[] = [
  { name: 'Fajr', time: '05:15' },
  { name: 'Dhuhr', time: '14:10' },
  { name: 'Asr', time: '18:20' },
  { name: 'Maghrib', time: '+10 min' },
  { name: 'Isha', time: '23:30' },
];
