import { parsePhoneNumberFromString } from 'npm:libphonenumber-js@1.11.19';

// Numbers without a leading + are parsed in the default market (US).
// Non-US local numbers must be entered in international format.
const DEFAULT_COUNTRY = 'US';

/**
 * Normalizes any plausible phone number to canonical E.164 (e.g. "+14155551234").
 * Returns null for structurally invalid numbers (e.g. "123456789101112").
 */
export function normalizePhoneE164(input) {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return null;
  try {
    const parsed = parsePhoneNumberFromString(raw, DEFAULT_COUNTRY);
    if (!parsed || !parsed.isValid()) return null;
    return parsed.format('E.164');
  } catch (err) {
    return null;
  }
}