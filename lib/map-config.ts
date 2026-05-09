export const BOJONGSOANG_BOUNDS = {
  minLat: -7.035,
  maxLat: -6.935,
  minLng: 107.58,
  maxLng: 107.69,
};

export const HOTSPOT_MATCH_RADIUS_METERS = 75;

export function isWithinBojongsoangBounds(latitude: number, longitude: number) {
  return (
    latitude >= BOJONGSOANG_BOUNDS.minLat &&
    latitude <= BOJONGSOANG_BOUNDS.maxLat &&
    longitude >= BOJONGSOANG_BOUNDS.minLng &&
    longitude <= BOJONGSOANG_BOUNDS.maxLng
  );
}
