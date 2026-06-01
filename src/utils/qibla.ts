const makkah = {
  latitude: 21.4225,
  longitude: 39.8262,
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function calculateQiblaBearing(latitude: number, longitude: number) {
  const lat1 = toRadians(latitude);
  const lon1 = toRadians(longitude);
  const lat2 = toRadians(makkah.latitude);
  const lon2 = toRadians(makkah.longitude);
  const deltaLon = lon2 - lon1;

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return Math.round((toDegrees(Math.atan2(y, x)) + 360) % 360);
}
