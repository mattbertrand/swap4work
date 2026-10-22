import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, X, Zap, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authSignupUrl, authLoginUrl } from "@/lib/authNavigation";
import { useLanguage } from "@/i18n/LanguageContext";

export default function GuestBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white shadow-lg">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors z-10"
        aria-label={t("common.dismiss")}
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center gap-6">
        {/* Left: headline + perks */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            {t("common.free_to_join")}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-2">
            {t("guest.headline")}
          </h2>
          <p className="text-orange-100 text-sm md:text-base max-w-xl">
            {t("guest.subtitle")}
          </p>

          {/* Perks row */}
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>{t("guest.perk1")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-300" />
              <span>{t("guest.perk2")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
              <span>{t("guest.perk3")}</span>
            </div>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <Button
            size="lg"
            onClick={() => navigate(authSignupUrl(window.location.pathname + window.location.search))}
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-base px-8 py-6 h-auto shadow-xl rounded-xl"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {t("common.create_free_account")}
          </Button>
          <button
            onClick={() => navigate(authLoginUrl(window.location.pathname + window.location.search))}
            className="text-orange-100 hover:text-white text-sm underline underline-offset-2 transition-colors"
          >
            {t("common.already_have_account")}
          </button>
        </div>
      </div>
    </div>
  );
}