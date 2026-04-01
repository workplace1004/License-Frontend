/**
 * Vercel serverless: proxies address search to OpenStreetMap Nominatim with a valid User-Agent.
 * Same response shape as Nominatim `format=json` (array of results).
 */
export default async function handler(req, res) {
  const raw = req.query?.q;
  const q = typeof raw === 'string' ? raw.trim() : '';
  if (q.length < 2) {
    res.status(200).json([]);
    return;
  }

  const upstream = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=0&dedupe=1`;

  try {
    const r = await fetch(upstream, {
      headers: {
        'User-Agent': 'POS-Restaurant-License-Issuer/1.0 (https://github.com/)',
        Accept: 'application/json',
        'Accept-Language': 'en'
      }
    });
    if (!r.ok) {
      res.status(502).json([]);
      return;
    }
    const json = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(Array.isArray(json) ? json : []);
  } catch {
    res.status(502).json([]);
  }
}
