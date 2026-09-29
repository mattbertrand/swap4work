// Email entry reliability helpers for signup and login.
// Validation is syntax-only: legitimate uncommon providers (custom business,
// school, international, private domains) are never rejected. Domain-typo
// detection produces a SUGGESTION only — the user always stays in control.

const KNOWN_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "aol.com", "protonmail.com", "proton.me", "live.com", "msn.com",
  "comcast.net", "verizon.net", "att.net", "sbcglobal.net", "cox.net",
  "mail.com", "gmx.com", "ymail.com", "me.com", "zoho.com",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trim whitespace and lowercase — the same address the platform stores. */
export function normalizeEmail(raw) {
  return (raw || "").trim().toLowerCase();
}

/** Basic, provider-agnostic syntax check. */
export function isValidEmailFormat(raw) {
  const email = normalizeEmail(raw);
  if (!EMAIL_RE.test(email)) return false;
  const domain = email.slice(email.lastIndexOf("@") + 1);
  return !domain.includes("..") && !domain.startsWith(".") && !domain.endsWith(".");
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length || !b.length) return a.length + b.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * High-confidence domain-typo suggestion, or null.
 * Distance 1 is always suggested; distance 2 only for domains long enough
 * (8+ chars) to avoid flagging short legitimate domains.
 */
export function getTypoSuggestion(raw) {
  const email = normalizeEmail(raw);
  if (!isValidEmailFormat(email)) return null;
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (KNOWN_DOMAINS.includes(domain)) return null;

  let best = null;
  for (const known of KNOWN_DOMAINS) {
    const distance = levenshtein(domain, known);
    if (distance > 2) continue;
    if (distance === 2 && domain.length < 8) continue;
    if (!best || distance < best.distance) best = { domain: known, distance };
  }
  return best ? `${local}@${best.domain}` : null;
}

/** Public display form: "john@gmail.com" → "j***@gmail.com". */
export function maskEmail(raw) {
  const email = normalizeEmail(raw);
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  return `${email[0]}***@${email.slice(at + 1)}`;
}