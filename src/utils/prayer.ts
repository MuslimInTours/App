import { Prayer } from '../data/prayers';

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function getNextPrayer(prayers: Prayer[], now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return prayers.find((prayer) => toMinutes(prayer.time) >= currentMinutes) ?? prayers[0];
}

export function getPrayerCountdown(prayer: Prayer, now = new Date()) {
  const [hours, minutes] = prayer.time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const remainingHours = Math.floor(diffSeconds / 3600);
  const remainingMinutes = Math.floor((diffSeconds % 3600) / 60);
  const remainingSeconds = diffSeconds % 60;

  return `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes
    .toString()
    .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
