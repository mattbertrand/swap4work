import React from "react";
import { Badge } from "@/components/ui/badge";
import { Package, Briefcase, Layers } from "lucide-react";
import { getReturnTypes, summarizeReturnPrefs } from "@/lib/exchangePrefs";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ReturnPrefsSummary({ item, className = "" }) {
  const { t } = useLanguage();
  if (!item) return null;
  const want = getReturnTypes(item);

  const badge =
    want === "item" ? (
      <Badge className="bg-orange-100 text-orange-700">
        <Package className="w-3 h-3 mr-1" /> {t('listing.items')}
      </Badge>
    ) : want === "service" ? (
      <Badge className="bg-blue-100 text-blue-700">
        <Briefcase className="w-3 h-3 mr-1" /> {t('listing.services')}
      </Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-700">
        <Layers className="w-3 h-3 mr-1" /> {t('return.both')}
      </Badge>
    );

  const detail = summarizeReturnPrefs(item, t);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">{t('return.label')}</span>
        {badge}
      </div>
      {detail && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{detail}</p>
      )}
    </div>
  );
}