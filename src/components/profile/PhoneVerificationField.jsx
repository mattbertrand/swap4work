import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

// Validates international phone numbers in E.164-ish format or common patterns
const isValidPhone = (phone) => {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  // Must have 7–15 digits, optionally starting with +
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
};

export default function PhoneVerificationField({ value, onChange, isVerified, onVerified, userEmail, disabled = false }) {
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(null);
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val && !isValidPhone(val)) {
      setPhoneError("Enter a valid phone number (e.g. +1 555-555-5555 or +44 7911 123456)");
    } else {
      setPhoneError("");
    }
    // Reset verification if phone changes
    if (codeSent) {
      setCodeSent(false);
      setSentCode(null);
      setCode("");
    }
  };

  const handleSendCode = async () => {
    if (!isValidPhone(value)) {
      setPhoneError("Enter a valid phone number before sending a code");
      return;
    }
    setSending(true);
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(generatedCode);
    try {
      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: "Your Swap4Work Phone Verification Code",
        body: `Your phone verification code is: ${generatedCode}\n\nEnter this code to verify your phone number (${value}).\n\nThis code expires in 10 minutes.`
      });
      setCodeSent(true);
      toast.success("Verification code sent to your email!");
    } catch (err) {
      toast.error("Failed to send verification code. Please try again.");
      setSentCode(null);
    }
    setSending(false);
  };

  const handleVerify = () => {
    if (!code) return;
    setVerifying(true);
    setTimeout(() => {
      if (code.trim() === sentCode) {
        onVerified();
        toast.success("Phone number verified!");
        setCodeSent(false);
        setCode("");
        setSentCode(null);
      } else {
        toast.error("Incorrect code. Please try again.");
      }
      setVerifying(false);
    }, 400);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        {isVerified && (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          id="phone"
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder="+1 555-555-5555 or +44 7911 123456"
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
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : codeSent ? "Resend Code" : "Verify"}
          </Button>
        )}
      </div>

      {phoneError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <Phone className="w-3 h-3" /> {phoneError}
        </p>
      )}

      {!isVerified && (
        <p className="text-xs text-gray-500">
          {isVerified ? "" : "International format supported (e.g. +1 555-0123, +44 7911 123456)"}
        </p>
      )}

      {codeSent && !isVerified && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-sm text-blue-800">
            A 6-digit code was sent to <strong>{userEmail}</strong>. Enter it below to verify your phone number.
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
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}