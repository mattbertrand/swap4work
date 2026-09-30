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

// --- Custom ("Other") skills ---
// Free-text skills must be safe to store in the ';;'-joined skills string and
// to render as tags. Keep letters, numbers, spaces and a small set of common
// punctuation; strip everything else (including the storage separator).

export const MAX_SKILL_LENGTH = 40;
export const MAX_TOTAL_SKILLS = 40;

export function sanitizeCustomSkill(input) {
  let s = String(input || "")
    .replace(/[^a-zA-Z0-9 &()\-,'/]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  s = s.replace(/;/g, ""); // never allow the storage separator into a skill
  if (s.length > MAX_SKILL_LENGTH) s = s.slice(0, MAX_SKILL_LENGTH).trim();
  return s;
}

// Adds a sanitized custom skill, case-insensitively deduplicated against the
// current selections. Returns { skills, error } where error is one of
// 'empty' | 'duplicate' | 'limit' | null.
export function appendCustomSkill(currentSkills, input) {
  const skill = sanitizeCustomSkill(input);
  const list = Array.isArray(currentSkills) ? currentSkills : [];
  if (!skill) return { skills: list, error: "empty" };
  if (list.length >= MAX_TOTAL_SKILLS) return { skills: list, error: "limit" };
  if (list.some((s) => s.toLowerCase() === skill.toLowerCase())) {
    return { skills: list, error: "duplicate" };
  }
  return { skills: [...list, skill], error: null };
}