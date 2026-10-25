import React from "react";
import { Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SocialFollow() {
  const { t } = useLanguage();
  return (
    <div className="bg-white border-t border-orange-100 py-10 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t("home.follow_title")}</h3>
        <p className="text-sm text-gray-500 mb-6">{t("home.follow_sub")}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://www.facebook.com/profile.php?id=61594181534725"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              size="lg"
              variant="outline" 
              className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-8 py-6 h-auto w-full sm:w-auto"
            >
              <Facebook className="w-5 h-5 mr-2" />
              {t("home.follow_facebook")}
            </Button>
          </a>
          <a
            href="https://www.instagram.com/swap4work/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="bg-[#F77737] hover:bg-[#F77737]/90 text-white px-8 py-6 h-auto w-full sm:w-auto"
            >
              <Instagram className="w-5 h-5 mr-2" />
              {t("home.follow_instagram")}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}