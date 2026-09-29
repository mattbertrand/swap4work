import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmailField from "@/components/auth/EmailField";
import PasswordField from "@/components/auth/PasswordField";
import SocialSignInButtons from "@/components/auth/SocialSignInButtons";
import { normalizeEmail, isValidEmailFormat, maskEmail } from "@/lib/emailValidation";
import { getAuthErrorMessage, isUnverifiedError } from "@/lib/authErrors";
import { AlertCircle, Loader2, Info } from "lucide-react";

/**
 * Login. A generic error is shown for bad credentials (no account
 * enumeration). An unverified account (platform returns 403) is routed to
 * the verification/recovery flow instead of a dead end.
 */
export default function LogInForm({ onLoggedIn, onUnverified, onSwitchToSignUp, notice, initialEmail = "", returnPath }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normEmail = normalizeEmail(email);
    if (!isValidEmailFormat(normEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await base44.auth.loginViaEmailPassword(normEmail, password);
      onLoggedIn({ email: normEmail, password });
    } catch (err) {
      if (isUnverifiedError(err)) {
        onUnverified({ email: normEmail, password });
      } else {
        setError(getAuthErrorMessage(err, "Invalid email or password. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normEmail = normalizeEmail(email);
    setResetInfo("");
    if (!isValidEmailFormat(normEmail)) {
      setError("Enter your email address above first, then tap Forgot password again.");
      return;
    }

    setResetLoading(true);
    setError("");
    try {
      await base44.auth.resetPasswordRequest(normEmail);
      setResetInfo(
        `If an account exists for ${maskEmail(normEmail)}, you'll receive an email with password reset instructions.`
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Log in to continue your exchanges.</p>
      </div>

      {notice && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {notice}
        </div>
      )}

      <EmailField id="login-email" label="Email" value={email} onChange={setEmail} autoComplete="email" />
      <PasswordField id="login-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
      {resetInfo && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {resetInfo}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-base bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Logging in…
          </>
        ) : (
          "Log in"
        )}
      </Button>

      <SocialSignInButtons returnPath={returnPath} />

      <div className="flex flex-col gap-2 text-center text-sm">
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="text-gray-600 hover:text-gray-800 underline underline-offset-2"
        >
          {resetLoading ? "Sending instructions…" : "Forgot password?"}
        </button>
        <p className="text-gray-600">
          New to Swap4Work?{" "}
          <button type="button" onClick={onSwitchToSignUp} className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2">
            Create an account
          </button>
        </p>
      </div>
    </form>
  );
}