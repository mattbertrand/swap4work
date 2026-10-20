import { base44 } from "@/api/base44Client";

// A "Location checked" result is valid only while it has not expired AND the
// user's current primary city still matches the area that was checked.
// It never proves permanent residence — only that the device was in the
// claimed area when the check was run.

/** Public "City, ST" for a primary location — null if it can't be determined. */
export function checkIsCurrent(check, primaryArea) {
  if (!check || !check.expires_at) return false;
  if (new Date(check.expires_at) <= new Date()) return false;
  if (!primaryArea) return false;
  return check.checked_area === primaryArea;
}

/** Latest LocationCheck record for a user (readable by everyone; written only by the server). */
export async function fetchLocationCheck(userId) {
  if (!userId) return null;
  const records = await base44.entities.LocationCheck.filter({ user_id: userId }, "-created_date", 1);
  return records[0] || null;
}

/** Ask the browser for the device position once. Rejects with a friendly message. */
export function getDevicePosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser doesn't support location checks."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new Error("Location permission was denied. You can still use Swap4Work without the badge."));
        else if (err.code === 3) reject(new Error("Getting your location timed out. Please try again."));
        else reject(new Error("Your device location is unavailable right now."));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Run the optional check. Coordinates go to the server once and are not stored.
 * Returns { result: "checked" | "mismatch" | "no_primary_location" | "unavailable", ... }
 */
export async function runLocationCheck() {
  const coords = await getDevicePosition();
  const res = await base44.functions.invoke("checkDeviceLocation", coords);
  return res.data || {};
}