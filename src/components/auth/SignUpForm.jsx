import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmailField from "@/components/auth/EmailField";
import EmailConfirmField from "@/components/auth/EmailConfirmField";
import PasswordField from "@/components/auth/PasswordField";
import SocialSignInButtons from "@/components/auth/SocialSignInButtons";
import { normalizeEmail, isValidEmailFormat } from "@/lib/emailValidation";
import { getAuthErrorMessage, isDuplicateAccountError } from "@/lib/authErrors";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Signup: email + confirm email + password. The account is created by the
 * platform (which sends the verification code); onRegistered hands the
 * in-memory credentials to the verification step. No duplicate accounts:
 * the platform rejects an email that is already registered.
 */
export default function SignUpForm({ onRegistered, onSwitchToLogin, returnPath }) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normEmail = normalizeEmail(email);
    setDuplicate(false);

    if (!isValidEmailFormat(normEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (normalizeEmail(confirmEmail) !== normEmail) {
      setError("Email addresses don't match. Please check both fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await base44.auth.register({ email: normEmail, password });
      onRegistered({ email: normEmail, password });
    } catch (err) {
      if (isDuplicateAccountError(err)) {
        setDuplicate(true);
        setError("An account with this email already exists. Try logging in instead.");
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">Sign up free to start trading skills for items.</p>
      </div>

      <EmailField id="signup-email" label="Email" value={email} onChange={setEmail} autoComplete="email" />
      <EmailConfirmField id="signup-confirm-email" email={email} value={confirmEmail} onChange={setConfirmEmail} />
      <PasswordField
        id="signup-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="At least 8 characters."
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {error}
            {duplicate && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="block mt-1.5 font-semibold underline underline-offset-2 text-left"
              >
                Go to the login page
              </button>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-base bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Creating your account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <SocialSignInButtons returnPath={returnPath} />

      <p className="text-sm text-center text-gray-600">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2">
          Log in
        </button>
      </p>

      <p className="text-xs text-center text-gray-500">
        By signing up, you agree to our rules for fair exchanges and safe
        interactions. You must be at least 18 years old to use this platform.
      </p>
    </form>
  );
}