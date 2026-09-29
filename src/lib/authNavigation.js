// Helpers for routing users into the in-app auth flow and safely returning
// them to where they came from.

/** Only allow relative in-app paths as post-login destinations. */
export function sanitizeNextPath(path) {
  if (!path || typeof path !== "string") return null;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return null;
  return path;
}

export function authUrl(mode, nextPath) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  const next = sanitizeNextPath(nextPath);
  if (next) params.set("next", next);
  return `/auth?${params.toString()}`;
}

export const authLoginUrl = (nextPath) => authUrl("login", nextPath);
export const authSignupUrl = (nextPath) => authUrl("signup", nextPath);