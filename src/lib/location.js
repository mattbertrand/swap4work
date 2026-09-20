// Canonical location handling for Swap4Work.
//
// Public location display is ALWAYS the canonical "City, ST" form —
// never a street address, ZIP code, or any more precise value.
// Internal distance calculations continue to use latitude/longitude.

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

export const STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"Washington DC"
};

/** Normalize any state representation ("ca", "Ca", "California", " CA ") to "CA", or null. */
export function normalizeState(value) {
  const raw = (value || "").trim().replace(/\d+/g, "").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (US_STATES.includes(upper)) return upper;
  const abbr = Object.keys(STATE_NAMES).find(k => STATE_NAMES[k].toUpperCase() === upper);
  return abbr || null;
}

// Obvious placeholder/test values that are not real cities
const PLACEHOLDER_CITY_RE = /^(n\/?a|none|nil|null|unknown|tbd|test|xx+|same|here|home|city|town|wherever|anywhere|nowhere|\?+|\.+|\*+|[-_]+)$/i;

// A candidate that ends in a street suffix is an address line, not a city
const STREET_SUFFIX_RE = /\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln|court|ct|circle|cir|place|pl|terrace|ter|way|highway|hwy|parkway|pkwy|trail|trl)\b\.?$/i;

/**
 * A city is usable as a public location only if it looks like a real city:
 * non-empty, contains letters, no digits, and no placeholder/street values.
 */
export function isValidCityName(city) {
  const c = (city || "").trim();
  if (!c || c.length < 2) return false;
  if (PLACEHOLDER_CITY_RE.test(c)) return false;
  if (/\d/.test(c)) return false;
  if (!/[a-z]/i.test(c)) return false;
  if (STREET_SUFFIX_RE.test(c)) return false;
  return true;
}

/**
 * Normalize city capitalization for public display:
 * "petaluma" / "PETALUMA" / "san rafael" → "Petaluma" / "San Rafael",
 * while preserving legitimately mixed-case names like "McKinleyville".
 */
export function normalizeCityName(city) {
  const c = (city || "").trim();
  if (!c) return "";
  const isLower = c === c.toLowerCase();
  const isUpper = c === c.toUpperCase();
  if (!isLower && !isUpper) return c;
  return c.toLowerCase().replace(/(^|[\s'\u2019-])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase());
}

/**
 * Extract the canonical public location "City, ST" from any stored location
 * string (full address, "City, ST ZIP", "City, ca", etc.).
 * Returns null when no valid city + state can be determined — callers must
 * then show a fallback like "Location unavailable" and NEVER fall back to
 * showing a street address.
 */
export function formatPublicLocation(raw) {
  if (!raw || typeof raw !== "string") return null;
  const parts = raw
    .split(",")
    .map(p => p.replace(/\b\d{5}(-\d{4})?\b/g, "").trim())
    .filter(Boolean);
  let stateIdx = -1;
  let stateAbbr = null;
  for (let i = parts.length - 1; i >= 0; i--) {
    const abbr = normalizeState(parts[i]);
    if (abbr) { stateIdx = i; stateAbbr = abbr; break; }
  }
  if (!stateAbbr) return null;
  for (let i = stateIdx - 1; i >= 0; i--) {
    const city = normalizeCityName(parts[i]);
    if (isValidCityName(city)) return `${city}, ${stateAbbr}`;
  }
  return null;
}