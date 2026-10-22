import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { isValidEmailFormat, getTypoSuggestion, normalizeEmail } from "@/lib/emailValidation";

/**
 * Email entry with visible normalization (trim + lowercase on blur),
 * clear format validation, and an optional domain-typo suggestion the
 * user can accept or dismiss. Nothing is ever changed silently.
 */
export default function EmailField({
  id,
  label = "Email",
  value,
  onChange,
  autoComplete = "email",
  placeholder = "you@example.com",
  disabled,
  showSuggestion = true,
}) {
  const [dismissedFor, setDismissedFor] = useState("");
  const { t } = useLanguage();

  const formatError = !!value && !isValidEmailFormat(value);
  const suggestion =
    showSuggestion && !formatError && value && normalizeEmail(value) !== dismissedFor
      ? getTypoSuggestion(value)
      : null;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={formatError}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(normalizeEmail(value))}
      />
      {formatError && (
        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {t("auth.err_invalid_email")}
        </p>
      )}
      {suggestion && (
        <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-900">
            {t("auth.did_you_mean", { email: suggestion })}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => onChange(suggestion)}
              className="text-xs font-semibold bg-amber-600 text-white rounded-lg px-3 py-1.5 hover:bg-amber-700 transition-colors"
            >
              {t("auth.use_this_email")}
            </button>
            <button
              type="button"
              onClick={() => setDismissedFor(normalizeEmail(value))}
              className="text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
            >
              {t("auth.keep_my_email")}
            </button>
          </div>
        </div>
      )}
      {!formatError && value && !suggestion && dismissedFor && (
        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          {t("auth.email_normalized", { email: normalizeEmail(value) })}
        </p>
      )}
    </div>
  );
}