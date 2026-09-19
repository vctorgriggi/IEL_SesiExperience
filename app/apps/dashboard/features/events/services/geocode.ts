/**
 * Geocode an address string using Nominatim (OpenStreetMap).
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Arki-Dashboard/1.0 (event location geocoding)';

export type GeocodeResult = {
  lat: number;
  lon: number;
  displayName: string;
};

export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const trimmed = address?.trim();
  if (!trimmed || trimmed.length < 3) return null;

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: '1',
      addressdetails: '0'
    });
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
    }>;
    const first = data[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number.parseFloat(first.lat);
    const lon = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      lat,
      lon,
      displayName: first.display_name ?? trimmed
    };
  } catch {
    return null;
  }
}
