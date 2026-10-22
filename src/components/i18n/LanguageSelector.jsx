import React from "react";
import { Languages, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, LANGUAGES } from "@/i18n/LanguageContext";

// Accessible language selector: works on desktop and mobile, shows the active
// language, no flags (names only).
export default function LanguageSelector({ className = "" }) {
  const { lang, setLang, t } = useLanguage();
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("lang.select")}
          title={t("lang.select")}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors ${className}`}
        >
          <Languages className="w-4 h-4 text-orange-600" />
          <span aria-hidden="true">{current.short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className="cursor-pointer"
            aria-current={l.code === lang ? "true" : undefined}
          >
            <span className="flex-1">{l.name}</span>
            {l.code === lang && <Check className="w-4 h-4 text-orange-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}