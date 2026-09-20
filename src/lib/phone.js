import { parsePhoneNumberFromString } from "libphonenumber-js";

// Numbers without a leading + are parsed in the default market (US — this is
// a US-local marketplace). Ambiguous non-US local numbers must be entered in
// international format starting with + and the country code.
const DEFAULT_COUNTRY = "US";

function parsePhone(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_COUNTRY);
    if (!parsed || !parsed.isValid()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Structurally plausible phone number (does NOT prove the number is real/assigned). */
export function isValidPhone(input) {
  return parsePhone(input) !== null;
}

/** Canonical E.164 form (e.g. "+14155551234"), or null when invalid. */
export function normalizePhoneToE164(input) {
  const parsed = parsePhone(input);
  return parsed ? parsed.format("E.164") : null;
}

/** Readable international display (e.g. "+1 415 555 1234") for a stored number. */
export function formatPhoneDisplay(input) {
  const parsed = parsePhone(input);
  return parsed ? parsed.formatInternational() : (input || "");
}