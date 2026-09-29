import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmailField from "@/components/auth/EmailField";
import EmailConfirmField from "@/components/auth/EmailConfirmField";
import PasswordField from "@/components/auth/PasswordField";
import { normalizeEmail, isValidEmailFormat } from "@/lib/emailValidation";
import { getAuthErrorMessage, isDuplicateAccountError } from "@/lib/authErrors";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";

/**
 * Change email for an account whose address has not been verified yet.
 * Because an email address cannot be re-pointed at an existing account, the
 * corrected address is registered (a new verification code is sent to it)
 * and verification completes on the new account. The wrong-address account
 * stays unverified and can never log in. Password is reused from the current
 * flow when available.
 */
export default function ChangeEmailPanel({ password, onEmailRegistered, onCancel, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
    const effectivePassword = password || newPassword;
    if (!effectivePassword || effectivePassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await base44.auth.register({ email: normEmail, password: effectivePassword });
      onEmailRegistered({ email: normEmail, password: effectivePassword });
    } catch (err) {
      if (isDuplicateAccountError(err)) {
        setDuplicate(true);
        setError("An account with this email already exists. Try logging in with it.");
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
        <h1 className="text-2xl font-bold text-gray-900">Change email address</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the correct email address — we'll send a new verification code
          to it, and your account will use the new address.
        </p>
      </div>

      <EmailField id="change-email" label="New email" value={email} onChange={setEmail} autoComplete="email" />
      <EmailConfirmField id="change-confirm-email" email={email} value={confirmEmail} onChange={setConfirmEmail} />

      {password ? (
        <p className="text-xs text-gray-500 rounded-xl bg-gray-50 border border-gray-200 p-3">
          You'll keep the same password.
        </p>
      ) : (
        <PasswordField
          id="change-password"
          label="Create a password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
      )}

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
            <Loader2 className="w-4 h-4 animate-spin" /> Sending a new code…
          </>
        ) : (
          "Send a new code"
        )}
      </Button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to the verification code
      </button>
    </form>
  );
}