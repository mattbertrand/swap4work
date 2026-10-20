import { base44 } from "@/api/base44Client";
import { isValidCityName } from "@/lib/location";

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
export async function verifyLocationOnline(fields, { zipOptional = false } = {}) {
  const city = (fields.city || "").trim();
  const state = (fields.state || "").trim();
  const zip = (fields.zip || "").trim();

  // Fast local format checks — no API call for obviously bad input
  if (!city) return { status: "invalid", field: "city", message: "City is required" };
  if (!isValidCityName(city)) return { status: "invalid", field: "city", message: "Please enter a valid city." };
  if (!state) return { status: "invalid", field: "state", message: "State is required" };
  if (!zip && !zipOptional) return { status: "invalid", field: "zip", message: "ZIP code is required" };
  if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) return { status: "invalid", field: "zip", message: "Enter a valid 5-digit ZIP code" };

  try {
    const res = await base44.functions.invoke("validateLocation", { city, state, zip });
    const data = res.data || {};

    if (data.result === "valid") {
      const canonical = (data.city || city).trim();
      const strip = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (strip(canonical) !== strip(city)) {
        // The service resolved the input to a different place — never
        // silently replace what the user typed with it
        return {
          status: "invalid",
          field: "city",
          message: `We couldn't verify "${city}" as a city in ${state}. Did you mean "${canonical}"? Enter the full city name to continue.`
        };
      }
      return { status: "valid", city: canonical, latitude: data.latitude, longitude: data.longitude };
    }

    if (data.result === "unavailable") {
      return { status: "unavailable", message: "We're unable to verify your location right now. Please try again." };
    }

    const reasons = {
      city_not_found: { field: "city", message: "We couldn't verify this city. Please check the city, state, and ZIP code." },
      zip_not_found: { field: "zip", message: "We couldn't verify this ZIP code. Please double-check it." },
      zip_state_mismatch: { field: "zip", message: "This ZIP code doesn't match the selected state. Please check the city, state, and ZIP code." }
    };
    const info = reasons[data.reason] || {
      field: "city",
      message: "We couldn't verify this location. Please check the city, state, and ZIP code."
    };
    return { status: "invalid", ...info };
  } catch (error) {
    const statusCode = error?.response?.status;
    if (statusCode === 429) {
      return { status: "unavailable", message: "We're checking locations too often. Please wait a moment and try again." };
    }
    return { status: "unavailable", message: "We're unable to verify your location right now. Please try again." };
  }
}