import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, MailCheck, Phone } from "lucide-react";
import { toast } from "sonner";
import { isValidPhone, normalizePhoneToE164 } from "@/lib/phone";
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Phone number entry with the current email-based confirmation flow.
 *
 * IMPORTANT: the confirmation code is emailed to the user's ACCOUNT email —
 * it confirms the user controls their account, NOT that they own the phone
 * number. The UI must never claim the phone number itself is "verified".
 */
export default function PhoneVerificationField({ value, onChange, isVerified, onVerified, onUnverified, userEmail, disabled = false }) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const valid = isValidPhone(val);
    setPhoneValid(valid);
    setPhoneError(val && !valid ? 'profile.err_phone' : '');
    // Any change to the number invalidates the previous confirmation
    if (isVerified && onUnverified) onUnverified();
    setCodeSent(false);
    setCode("");
  };

  // Normalize to E.164 once the user leaves the field
  const handleBlur = () => {
    if (value && isValidPhone(value)) {
      const e164 = normalizePhoneToE164(value);
      if (e164 && e164 !== value) onChange(e164);
    }
  };

  const handleSendCode = async () => {
    const e164 = normalizePhoneToE164(value);
    if (!e164) {
      setPhoneValid(false);
      setPhoneError('profile.err_phone');
      return;
    }
    if (e164 !== value) onChange(e164); // store the normalized form
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendPhoneVerificationCode', { phone: e164 });
      if (res.data?.sent) {
        setCodeSent(true);
        toast.success(t('phone.sent'));
      } else {
        throw new Error(res.data?.error || 'Failed to send code');
      }
    } catch (err) {
      toast.error(t('phone.send_error'));
    }
    setSending(false);
  };

  const handleVerify = async () => {
    const e164 = normalizePhoneToE164(value);
    if (!e164 || !code) return;
    setVerifying(true);
    try {
      const res = await base44.functions.invoke('verifyPhoneVerificationCode', { phone: e164, code });
      if (res.data?.confirmed) {
        onVerified();
        toast.success(t('phone.saved'));
        setCodeSent(false);
        setCode("");
      } else {
        toast.error(t('phone.code_error'));
      }
    } catch (err) {
      toast.error(t('phone.code_error'));
    }
    setVerifying(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="phone">
          {t('phone.label')} <span className="text-red-500">*</span>
        </Label>
        {isVerified && (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <MailCheck className="w-3 h-3 mr-1" />
            {t('phone.confirmed')}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          id="phone"
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          onBlur={handleBlur}
          placeholder={t('phone.placeholder')}
          disabled={disabled}
          className={`flex-1 ${phoneError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
        />
        {!disabled && !isVerified && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCode}
            disabled={sending || !value || !!phoneError}
            className="whitespace-nowrap"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : codeSent ? t('auth.resend_btn') : t('phone.send')}
          </Button>
        )}
      </div>

      {phoneError ? (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <Phone className="w-3 h-3" /> {t(phoneError)}
        </p>
      ) : phoneValid ? (
        <p className="text-xs text-green-600">{t('phone.valid')}</p>
      ) : null}

      {!isVerified && (
        <p className="text-xs text-gray-500">
          {t('phone.help')}
        </p>
      )}

      {codeSent && !isVerified && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-sm text-blue-800">
            {t('phone.code_help', { email: userEmail })}
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-36 text-center tracking-widest text-lg font-mono"
            />
            <Button
              type="button"
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.confirm')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}