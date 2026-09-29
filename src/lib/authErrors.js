// Maps platform auth API errors to friendly, non-sensitive messages.
// Never reveals whether a specific account exists beyond what the
// platform itself already discloses.

function errorData(error) {
  return error?.response?.data || error?.data || {};
}

function errorStatus(error) {
  return error?.response?.status ?? error?.status;
}

function errorMessage(error) {
  const data = errorData(error);
  return String(data.message || data.detail || error?.message || "");
}

/** Login failed because the account's email has not been verified yet. */
export function isUnverifiedError(error) {
  return errorStatus(error) === 403 || /not verified|otp/i.test(errorMessage(error));
}

/** Registration failed because an account already uses that email. */
export function isDuplicateAccountError(error) {
  return /already (registered|exists)|already has an account|user already/i.test(errorMessage(error));
}

export function getAuthErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const raw = errorMessage(error);
  const status = errorStatus(error);

  if (status === 422) return raw || "Please check your details and try again.";
  if (/invalid email or password/i.test(raw)) return "Invalid email or password. Please try again.";
  if (/rate|too many|frequent/i.test(raw)) return "Too many requests. Please wait a moment and try again.";
  if (/user not found/i.test(raw)) return "We couldn't find an account with that email. Please check it or create a new account.";
  if (raw && raw.length <= 140) return raw;
  return fallback;
}