import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskEmail } from "@/lib/emailValidation";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { useLanguage } from "@/i18n/LanguageContext";
import { MailCheck, RefreshCw, AlertCircle, CheckCircle2, Info } from "lucide-react";

const RESEND_COOLDOWN_SECONDS = 45;

/**
 * Verification screen: masked destination address, code entry, resend with a
 * visible countdown, spam/junk guidance, and a path to change the email.
 * Codes are generated, expirable and single-use on the platform side — this
 * panel only submits them.
 */
export default function VerifyEmailPanel({ email, onVerifySuccess, onChangeEmail, notice }) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const codeInputRef = useRef(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setVerifying(true);
    setCodeError(false);
    try {
      await base44.auth.verifyOtp({ email, otpCode: trimmed });
      onVerifySuccess();
    } catch {
      setCodeError(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setResendError("");
    setResendMessage("");
    try {
      await base44.auth.resendOtp(email);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setResendMessage(t("auth.resend_sent", { seconds: RESEND_COOLDOWN_SECONDS }));
    } catch (err) {
      setResendError(getAuthErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("auth.check_email_title")}</h1>
        <p className="text-sm text-gray-600 mt-2">{t("auth.check_email_sub")}</p>
        <p className="font-bold text-gray-900 mt-1">{maskEmail(email)}</p>
        <p className="text-sm text-gray-500 mt-2">
          {t("auth.check_email_body")}
        </p>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {notice}
        </div>
      )}

      <form onSubmit={handleVerify} noValidate className="space-y-4">
        <div>
          <Label htmlFor="otp-code">{t("auth.code_label")}</Label>
          <Input
            id="otp-code"
            ref={codeInputRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t("auth.code_placeholder")}
            value={code}
            maxLength={8}
            aria-invalid={codeError}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeError(false);
            }}
            className={`text-center text-lg tracking-[0.35em] font-semibold h-12 ${codeError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
          />
        </div>

        {codeError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm">
            <p className="font-semibold text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {t("auth.code_wrong")}
            </p>
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setCode("");
                  setCodeError(false);
                  codeInputRef.current?.focus();
                }}
                className="font-semibold text-red-700 underline underline-offset-2"
              >
                {t("auth.try_again")}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={secondsLeft > 0 || resending}
                className="font-semibold text-red-700 underline underline-offset-2 disabled:opacity-50"
              >
                {t("auth.send_new_code")}
              </button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={verifying || !code.trim()}
          className="w-full h-11 text-base bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
        >
          {verifying ? t("auth.verifying") : t("auth.verify_btn")}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
        {resendMessage && (
          <p className="text-sm text-green-700 flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {resendMessage}
          </p>
        )}
        {resendError && (
          <p className="text-sm text-red-600 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {resendError}
          </p>
        )}

        <p className="text-sm font-semibold text-gray-900">{t("auth.didnt_receive")}</p>
        <ul className="text-sm text-gray-500 space-y-1.5 list-disc pl-5">
          <li>{t("auth.check_spam")}</li>
          <li>{t("auth.check_address")}</li>
          <li>{t("auth.check_spam")}</li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={resending || secondsLeft > 0}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? t("auth.sending") : secondsLeft > 0 ? t("auth.resend_in", { seconds: secondsLeft }) : t("auth.resend_btn")}
          </Button>
          <Button type="button" variant="outline" onClick={onChangeEmail} className="flex-1">
            {t("auth.change_email_btn")}
          </Button>
        </div>
      </div>
    </div>
  );
}