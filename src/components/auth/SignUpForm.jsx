import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmailField from "@/components/auth/EmailField";
import EmailConfirmField from "@/components/auth/EmailConfirmField";
import PasswordField from "@/components/auth/PasswordField";
import SocialSignInButtons from "@/components/auth/SocialSignInButtons";
import { normalizeEmail, isValidEmailFormat } from "@/lib/emailValidation";
import { getAuthErrorMessage, isDuplicateAccountError } from "@/lib/authErrors";
import { useLanguage } from "@/i18n/LanguageContext";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Signup: email + confirm email + password. The account is created by the
 * platform (which sends the verification code); onRegistered hands the
 * in-memory credentials to the verification step. No duplicate accounts:
 * the platform rejects an email that is already registered.
 */
export default function SignUpForm({ onRegistered, onSwitchToLogin, returnPath }) {
  const { t } = useLanguage();
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
      setError(t("auth.err_invalid_email"));
      return;
    }
    if (normalizeEmail(confirmEmail) !== normEmail) {
      setError(t("auth.email_mismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.err_password_short"));
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
        setError(t("auth.err_duplicate"));
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
        <h1 className="text-2xl font-bold text-gray-900">{t("auth.create_account_title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("auth.signup_sub")}</p>
      </div>

      <EmailField id="signup-email" label={t("auth.email")} value={email} onChange={setEmail} autoComplete="email" />
      <EmailConfirmField id="signup-confirm-email" email={email} value={confirmEmail} onChange={setConfirmEmail} />
      <PasswordField
        id="signup-password"
        label={t("auth.password")}
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint={t("auth.password_hint")}
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
                {t("auth.go_login")}
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
            <Loader2 className="w-4 h-4 animate-spin" /> {t("auth.creating")}
          </>
        ) : (
          t("auth.create_account_btn")
        )}
      </Button>

      <SocialSignInButtons returnPath={returnPath} />

      <p className="text-sm text-center text-gray-600">
        {t("auth.have_account")}{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2">
          {t("auth.login_btn")}
        </button>
      </p>

      <p className="text-xs text-center text-gray-500">
        {t("auth.signup_terms")}
      </p>
    </form>
  );
}