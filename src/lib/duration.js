// Work-time helpers: durations are stored as decimal hours (e.g. 1.5 = 01:30),
// entered and displayed as "HH:MM". Minimum allowed work time is 5 minutes.
export const MIN_TOTAL_MINUTES = 5;

export function hoursMinutesToDecimal(hours, minutes) {
  const totalMinutes = Math.round((hours || 0) * 60 + (minutes || 0));
  if (totalMinutes <= 0) return null;
  return Math.round((totalMinutes / 60) * 1e6) / 1e6;
}

export function decimalToHoursMinutes(decimal) {
  const totalMinutes = Math.round((Number(decimal) || 0) * 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

// "01:30" style text from a decimal hours value ("" for empty/zero)
export function formatHmInput(decimal) {
  const num = parseFloat(decimal);
  if (!num || num <= 0) return "";
  const { hours, minutes } = decimalToHoursMinutes(num);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Digits-only text -> { hours, minutes }. "0130" -> 1h30m, "05" -> 5m.
export function parseHmInput(text) {
  const digits = (text || "").replace(/\D/g, "");
  if (!digits) return { hours: 0, minutes: 0 };
  if (digits.length <= 2) return { hours: 0, minutes: parseInt(digits, 10) };
  return {
    hours: parseInt(digits.slice(0, digits.length - 2), 10),
    minutes: parseInt(digits.slice(-2), 10)
  };
}

// "5m", "1h 30m" or "2h" from a decimal hours value ("" for empty/zero)
export function formatDuration(decimal) {
  const num = parseFloat(decimal);
  if (num == null || isNaN(num) || num <= 0) return "";
  const { hours, minutes } = decimalToHoursMinutes(num);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}