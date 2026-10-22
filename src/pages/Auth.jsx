import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { sanitizeNextPath } from "@/lib/authNavigation";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import SignUpForm from "@/components/auth/SignUpForm";
import LogInForm from "@/components/auth/LogInForm";
import VerifyEmailPanel from "@/components/auth/VerifyEmailPanel";
import ChangeEmailPanel from "@/components/auth/ChangeEmailPanel";

const LOGO_URL = "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/72467c977_Swap4WorkFinalLogov2.png";

/**
 * In-app signup / login / verification flow, built on the platform's auth
 * backend (register → OTP email → verifyOtp → loginViaEmailPassword).
 * The pending { email, password } pair is kept in memory only, so the
 * verification step can auto-log the user in once their email is verified.
 */
export default function Auth() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get("next")), [searchParams]);
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [pending, setPending] = useState(null);
  const [loginNotice, setLoginNotice] = useState("");
  const [loginPrefillEmail, setLoginPrefillEmail] = useState("");

  const switchMode = (next, opts = {}) => {
    setMode(next);
    setLoginNotice(opts.notice || "");
    setLoginPrefillEmail(opts.prefillEmail || "");
    setSearchParams(
      (params) => {
        params.set("mode", next);
        return params;
      },
      { replace: true }
    );
  };

  const redirectAfterLogin = () => {
    window.location.href = nextPath || createPageUrl("Home");
  };

  const handleRegistered = ({ email, password }) => {
    setPending({ email, password });
    switchMode("verify");
  };

  const handleUnverifiedLogin = ({ email, password }) => {
    setPending({ email, password });
    switchMode("verify");
  };

  const handleEmailRegistered = ({ email, password }) => {
    setPending({ email, password });
    switchMode("verify");
  };

  const handleVerified = async () => {
    try {
      await base44.auth.loginViaEmailPassword(pending.email, pending.password);
      redirectAfterLogin();
    } catch {
      switchMode("login", {
        notice: t("auth.verified_notice"),
        prefillEmail: pending.email,
      });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 md:py-14">
      <div className="flex items-center justify-end mb-8">
        <LanguageSelector />
      </div>
      <div className="text-center mb-8">
        <img src={LOGO_URL} alt="Swap4Work" className="h-12 w-auto mx-auto object-contain" />
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-6 md:p-8">
        {mode === "signup" && (
          <SignUpForm
            onRegistered={handleRegistered}
            onSwitchToLogin={() => switchMode("login", { prefillEmail: loginPrefillEmail })}
            returnPath={nextPath}
          />
        )}

        {mode === "login" && (
          <LogInForm
            notice={loginNotice}
            initialEmail={loginPrefillEmail}
            onLoggedIn={redirectAfterLogin}
            onUnverified={handleUnverifiedLogin}
            onSwitchToSignUp={() => switchMode("signup")}
            returnPath={nextPath}
          />
        )}

        {mode === "verify" && pending && (
          <VerifyEmailPanel
            email={pending.email}
            onVerifySuccess={handleVerified}
            onChangeEmail={() => switchMode("change")}
          />
        )}

        {mode === "change" && pending && (
          <ChangeEmailPanel
            password={pending.password}
            onEmailRegistered={handleEmailRegistered}
            onCancel={() => switchMode("verify")}
            onSwitchToLogin={() => switchMode("login", { prefillEmail: loginPrefillEmail })}
          />
        )}

        {(mode === "verify" || mode === "change") && !pending && (
          <LogInForm
            onLoggedIn={redirectAfterLogin}
            onUnverified={handleUnverifiedLogin}
            onSwitchToSignUp={() => switchMode("signup")}
            returnPath={nextPath}
          />
        )}
      </div>
    </div>
  );
}