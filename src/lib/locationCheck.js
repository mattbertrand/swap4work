import { base44 } from "@/api/base44Client";

// The browser never queries LocationCheck records. It asks the server for a
// yes/no indicator (public) or for its own details (owner only).
// A check is valid only while it has not expired AND the member's current
// primary city still matches the area that was checked. It never proves
// permanent residence — only that the device was in the claimed area then.

/** Server-computed public indicator for a member's profile: true or false only. */
export async function fetchLocationStatus(userId) {
  if (!userId) return false;
  const res = await base44.functions.invoke("getLocationCheckStatus", { user_id: userId });
  return res.data?.checked === true;
}

/** Owner-only details for the signed-in member's own profile card. */
export async function fetchMyLocationCheckDetails() {
  const res = await base44.functions.invoke("getMyLocationCheckDetails", {});
  return res.data || {};
}

/** Ask the browser for the device position once. Rejects with a friendly message. */
export function getDevicePosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('location.unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new Error('location.denied'));
        else if (err.code === 3) reject(new Error('location.timeout'));
        else reject(new Error('location.unavailable'));
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