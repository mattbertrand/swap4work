import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchLocationCheck, checkIsCurrent } from "@/lib/locationCheck";
import { formatPublicLocation } from "@/lib/location";
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Public "Location checked" badge. Shown only when a server-recorded check
 * exists, has not expired, and still matches the member's current primary
 * "City, ST". Never shown for merely valid/manual locations.
 */
export default function LocationCheckedBadge({ userId, location, className = "" }) {
  const { t } = useLanguage();
  const { data: check } = useQuery({
    queryKey: ["locationCheck", userId],
    queryFn: () => fetchLocationCheck(userId),
    enabled: !!userId
  });

  if (!checkIsCurrent(check, formatPublicLocation(location))) return null;

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