/**
 * OpenStreetMap Nominatim search results (via dev proxy or VITE_ADDRESS_SUGGEST_URL).
 * @param {unknown} json
 * @returns {{ placeId: number | string; label: string }[]}
 */
export function normalizeNominatimResults(json) {
  if (!Array.isArray(json)) return [];
  return json
    .filter((row) => row && typeof row.display_name === 'string')
    .map((row) => ({
      placeId: row.place_id ?? `${row.lat},${row.lon},${row.display_name}`,
      label: row.display_name
    }));
}

export function addressSuggestRequestUrl(query) {
  const base = (import.meta.env.VITE_ADDRESS_SUGGEST_URL || '').trim().replace(/\/$/, '');
  const path = base || '/issuer-geocode/suggest';
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}q=${encodeURIComponent(query)}`;
}
