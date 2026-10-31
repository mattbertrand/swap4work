import { base44 } from "@/api/base44Client";
import { isValidCityName } from "@/lib/location";
import { translate } from '@/i18n';

/**
 * Verify a manually entered City + State + ZIP against real geographic data
 * (OpenStreetMap/Nominatim — the same service behind "Locate Me"), via the
 * validateLocation backend function. Called ONLY on Save — never per keystroke.
 *
 * Returns one of:
 *   { status: "valid",      city, latitude, longitude }  — canonical city name
 *   { status: "invalid",    message, field }             — save must be blocked
 *   { status: "unavailable", message }                    — service down; caller
 *                                                            may fall back to the
 *                                                            local format checks
 */
export async function verifyLocationOnline(fields, { zipOptional = false, t = (key, vars) => translate('en', key, vars) } = {}) {
  const city = (fields.city || '').trim();
  const state = (fields.state || '').trim();
  const zip = (fields.zip || '').trim();
  const invalid = (field, key, vars) => ({ status: 'invalid', field, message: t(key, vars), messageKey: key, vars });
  if (!city) return invalid('city', 'profile.err_city_required');
  if (!isValidCityName(city)) return invalid('city', 'profile.err_city_invalid');
  if (!state) return invalid('state', 'profile.err_state_required');
  if (!zip && !zipOptional) return invalid('zip', 'profile.err_zip_required');
  if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) return invalid('zip', 'profile.zip_invalid');
  try {
    const res = await base44.functions.invoke('validateLocation', { city, state, zip });
    const data = res.data || {};
    if (data.result === 'valid') {
      const canonical = (data.city || city).trim();
      const strip = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (strip(canonical) !== strip(city)) return invalid('city', 'location.suggestion', { city, state, canonical });
      return { status: 'valid', city: canonical, latitude: data.latitude, longitude: data.longitude };
    }
    if (data.result === 'unavailable') return { status: 'unavailable', message: t('location.verify_unavailable') };
    const reasons = { city_not_found: ['city', 'location.invalid_city'], zip_not_found: ['zip', 'location.invalid_zip'], zip_state_mismatch: ['zip', 'location.zip_state'] };
    const [field, key] = reasons[data.reason] || ['city', 'location.invalid'];
    return invalid(field, key);
  } catch (error) {
    return { status: 'unavailable', message: t(error?.response?.status === 429 ? 'location.rate_limit' : 'location.verify_unavailable') };
  }
}