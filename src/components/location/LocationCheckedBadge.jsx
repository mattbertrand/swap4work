import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchLocationStatus } from "@/lib/locationCheck";
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Public "Location checked" badge. The server decides whether a valid,
 * unexpired check still matches the member's current "City, ST"; the browser
 * only ever receives true or false, so no check record is exposed.
 */
export default function LocationCheckedBadge({ userId, className = "" }) {
  const { t } = useLanguage();
  const { data: checked } = useQuery({
    queryKey: ["locationChecked", userId],
    queryFn: () => fetchLocationStatus(userId),
    enabled: !!userId
  });

  if (checked !== true) return null;

  return (
    <Badge
      className={`bg-green-100 text-green-700 hover:bg-green-100 ${className}`}
      title={t('location.check_tooltip')}
    >
      <BadgeCheck className="w-3 h-3 mr-1" />
      {t('location.checked')}
    </Badge>
  );
}