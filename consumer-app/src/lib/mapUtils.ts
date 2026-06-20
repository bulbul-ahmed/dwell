// Aftab Nagar, Dhaka approximate bounds
// mapX% = west→east (90.440 – 90.453), mapY% = north→south (23.759 – 23.748)
const BOUNDS = { north: 23.759, south: 23.748, west: 90.440, east: 90.453 };

export const AFTAB_NAGAR_CENTER = { lat: 23.7535, lng: 90.4465 };

export function toLatLng(mapX: string | null | undefined, mapY: string | null | undefined): { lat: number; lng: number } | null {
  const x = parseFloat(mapX ?? '');
  const y = parseFloat(mapY ?? '');
  if (!isFinite(x) || !isFinite(y)) return null;
  return {
    lat: BOUNDS.north - (y / 100) * (BOUNDS.north - BOUNDS.south),
    lng: BOUNDS.west  + (x / 100) * (BOUNDS.east  - BOUNDS.west),
  };
}
