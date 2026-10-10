// Shortens a full name for display: "Matthieu Bertrand" -> "Matthieu B."
// Full names are never shown in the UI; use this for every rendered name.
export function displayName(name) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}