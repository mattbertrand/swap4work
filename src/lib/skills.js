// Skills are stored as a single string. Newer records use ';;' as the
// separator (so commas inside skill names like "Mounting (TVs, shelves)"
// survive); older records use plain commas. This parser handles both,
// keeping commas that sit inside parentheses intact.

export function parseSkills(skillsString) {
  if (!skillsString) return [];
  const raw = String(skillsString).trim();
  if (!raw) return [];

  if (raw.includes(';;')) {
    return raw.split(';;').map(s => s.trim()).filter(Boolean);
  }

  // Legacy comma-separated value: only split on commas outside parentheses
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of raw) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map(s => s.trim()).filter(Boolean);
}