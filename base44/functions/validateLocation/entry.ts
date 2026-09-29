import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getActiveUser } from '../../shared/moderation.ts';

// Geographic validation of a manually entered City + State (+ ZIP) against
// OpenStreetMap via Nominatim — the same free service the app's "Locate Me"
// and address autocomplete already use. No new paid API.

// Full state names are required by Nominatim structured queries
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia'
};

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const REQUEST_HEADERS = {
  // Nominatim usage policy requires an identifiable User-Agent
  'User-Agent': 'Swap4Work/1.0 (swap4work.base44.app location validation)',
  'Accept-Language': 'en'
};

// Soft per-user rate limit — validation runs only on Save, never per keystroke
const rateBuckets = new Map();
const RATE_LIMIT_PER_HOUR = 15;

function checkRateLimit(userId) {
  const now = Date.now();
  if (rateBuckets.size > 5000) rateBuckets.clear();
  const entry = rateBuckets.get(userId);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_HOUR) return false;
  entry.count += 1;
  return true;
}

async function nominatimSearch(params) {
  const url = new URL(NOMINATIM_SEARCH);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: REQUEST_HEADERS, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Nominatim responded with ' + response.status);
  return response.json();
}

function extractCity(result) {
  const addr = result.address || {};
  return addr.city || addr.town || addr.village || addr.hamlet ||
    String(result.display_name || '').split(',')[0] || null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json().catch(() => ({}));
    const city = String(body.city || '').trim().slice(0, 80);
    const stateAbbr = String(body.state || '').trim().toUpperCase();
    const zip = String(body.zip || '').trim();
    const stateName = STATE_NAMES[stateAbbr];

    if (!city || !stateName) {
      return Response.json({ error: 'City and state are required' }, { status: 400 });
    }
    if (city.length < 2 || /\d/.test(city)) {
      return Response.json({ result: 'invalid', reason: 'city_not_found' });
    }
    if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
      return Response.json({ result: 'invalid', reason: 'zip_not_found' });
    }

    if (!checkRateLimit(user.id)) {
      return Response.json({ error: 'Too many location checks. Please try again later.' }, { status: 429 });
    }

    // 1) City + state lookup — the city must exist in the selected state
    const matches = await nominatimSearch({
      format: 'json', countrycodes: 'us', addressdetails: '1', limit: '5',
      city, state: stateName
    }).catch(() => null);
    if (matches === null) return Response.json({ result: 'unavailable' });
    if (!matches.length) {
      return Response.json({ result: 'invalid', reason: 'city_not_found' });
    }
    const best = matches[0];

    // 2) ZIP consistency, judged on its own: the ZIP must exist and belong to
    //    the selected state. ZIP and city boundaries don't always align, so a
    //    same-state ZIP is accepted; a ZIP from another state is inconsistent.
    if (zip) {
      const zipMatches = await nominatimSearch({
        format: 'json', countrycodes: 'us', addressdetails: '1', limit: '5', postalcode: zip
      }).catch(() => null);
      if (zipMatches === null) return Response.json({ result: 'unavailable' });
      if (!zipMatches.length) {
        return Response.json({ result: 'invalid', reason: 'zip_not_found' });
      }
      const withState = zipMatches.filter((r) => (r.address || {}).state);
      const zipInState = withState.length === 0 || withState.some((r) => r.address.state === stateName);
      if (!zipInState) {
        return Response.json({ result: 'invalid', reason: 'zip_state_mismatch' });
      }
    }
    return Response.json({
      result: 'valid', city: extractCity(best), state: stateAbbr,
      latitude: parseFloat(best.lat), longitude: parseFloat(best.lon)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}