import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { normalizeEmail } from "@/lib/emailValidation";

/** Confirm-email field with a visible mismatch message. */
export default function EmailConfirmField({ id, email, value, onChange }) {
  const mismatch = !!value && normalizeEmail(value) !== normalizeEmail(email);

  return (
    <div>
      <Label htmlFor={id}>Confirm email</Label>
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="Re-enter your email address"
        value={value}
        aria-invalid={mismatch}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(normalizeEmail(value))}
      />
      {mismatch && (
        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Email addresses don't match. Please check both fields.
        </p>
      )}
    </div>
  );
}