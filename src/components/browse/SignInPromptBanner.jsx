import React from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authLoginUrl } from "@/lib/authNavigation";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SignInPromptBanner({ message }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
      <Crosshair className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-orange-900">
        <p className="font-medium">{t("browse.sign_in_personalized")}</p>
        <p className="text-orange-700 mt-1">{message}</p>
      </div>
      <Button
        onClick={() => navigate(authLoginUrl(window.location.pathname + window.location.search))}
        size="sm"
        className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
      >
        {t("nav.sign_in")}
      </Button>
    </div>
  );
}