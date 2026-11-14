// Shared parsing and validity rules for the optional device location check.
// Used by checkDeviceLocation (writer) and by the read-only status endpoints so
// the browser never has to read LocationCheck records itself.

export const STATE_ABBR = {
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

// Pull the primary city + state out of a stored self-reported location string.
export function parsePrimaryArea(location: string) {
  const parts = String(location || '')
    .split(',')
    .map((p) => p.replace(/\b\d{5}(-\d{4})?\b/g, '').trim())
    .filter(Boolean);
  const abbrs = new Set(Object.values(STATE_ABBR));
  for (let i = parts.length - 1; i >= 1; i--) {
    const up = parts[i].toUpperCase();
    const abbr = abbrs.has(up) ? up : STATE_ABBR[parts[i].toLowerCase()];
    if (abbr) return { city: parts[i - 1], state: abbr };
  }
  return null;
}

// Canonical public "City, ST" for a stored location, or null.
export function publicArea(location: string) {
  const area = parsePrimaryArea(location);
  return area ? `${area.city}, ${area.state}` : null;
}

// A check is valid only while it has not expired AND it still matches the
// member's current primary area.
export function isCheckCurrent(check: any, area: string | null) {
  if (!check || !check.expires_at || !area) return false;
  if (new Date(check.expires_at) <= new Date()) return false;
  return check.checked_area === area;
}