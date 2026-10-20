import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getActiveUser } from '../../shared/moderation.ts';

// Optional "Location checked" badge. The browser sends the device's current
// coordinates ONCE; this function reverse-geocodes them, compares the result
// with the user's saved (self-reported) primary city, and — only on a match —
// records the checked AREA ("City, ST") and a timestamp in a server-only
// LocationCheck record. The raw coordinates are never stored.
//
// A match means "this device was in the claimed area at the time of the
// check". It is NOT proof of permanent residence.

const CHECK_VALID_DAYS = 90;
const MAX_DISTANCE_MILES = 30;
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const HEADERS = {
  'User-Agent': 'Swap4Work/1.0 (swap4work.base44.app location check)',
  'Accept-Language': 'en'
};

const STATE_ABBR = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC'
};

const rateBuckets = new Map();
const RATE_LIMIT_PER_HOUR = 10;

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

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const strip = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Pull "City, ST" out of the stored self-reported location string
function parsePrimaryArea(location) {
  const parts = String(location || '').split(',').map((p) => p.replace(/\b\d{5}(-\d{4})?\b/g, '').trim()).filter(Boolean);
  const abbrs = new Set(Object.values(STATE_ABBR));
  for (let i = parts.length - 1; i >= 1; i--) {
    const up = parts[i].toUpperCase();
    const abbr = abbrs.has(up) ? up : STATE_ABBR[parts[i].toLowerCase()];
    if (abbr) return { city: parts[i - 1], state: abbr };
  }
  return null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { user, status, error } = await getActiveUser(base44);
    if (!user) return Response.json({ error }, { status });

    const body = await req.json().catch(() => ({}));
    const lat = Number(body.latitude);
    const lon = Number(body.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const area = parsePrimaryArea(user.location);
    if (!area) {
      return Response.json({ result: 'no_primary_location' });
    }

    if (!checkRateLimit(user.id)) {
      return Response.json({ error: 'Too many location checks. Please try again later.' }, { status: 429 });
    }

    // Reverse-geocode the device position server-side
    const url = new URL(REVERSE_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) }).catch(() => null);
    if (!response || !response.ok) return Response.json({ result: 'unavailable' });
    const data = await response.json();
    const addr = data.address || {};
    const deviceCity = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '';
    const deviceState = STATE_ABBR[String(addr.state || '').toLowerCase()] || '';

    // Match 1: the device resolves to the same city and state as the claim
    let matched = !!deviceCity && strip(deviceCity) === strip(area.city) && deviceState === area.state;

    // Match 2: within a short distance of the claimed city's saved coordinates
    // (covers neighbourhoods/unincorporated areas that geocode to another name).
    // Server-saved coordinates only — never trusted from the request.
    if (!matched && deviceState === area.state && Number.isFinite(user.latitude) && Number.isFinite(user.longitude)) {
      matched = distanceMiles(lat, lon, user.latitude, user.longitude) <= MAX_DISTANCE_MILES;
    }

    if (!matched) {
      // Only the generic outcome is returned — no coordinates, no detected address
      return Response.json({ result: 'mismatch', claimed_area: `${area.city}, ${area.state}` });
    }

    const checkedArea = `${area.city}, ${area.state}`;
    const now = new Date();
    const expires = new Date(now.getTime() + CHECK_VALID_DAYS * 24 * 60 * 60 * 1000);
    const db = base44.asServiceRole.entities;
    const existing = await db.LocationCheck.filter({ user_id: user.id }, '-created_date', 20);
    const record = {
      user_id: user.id,
      checked_area: checkedArea,
      checked_date: now.toISOString(),
      expires_at: expires.toISOString()
    };
    if (existing[0]) await db.LocationCheck.update(existing[0].id, record);
    else await db.LocationCheck.create(record);

    return Response.json({
      result: 'checked',
      checked_area: checkedArea,
      checked_date: record.checked_date,
      expires_at: record.expires_at
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}