import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Crosshair, Loader2, Info } from "lucide-react";
import { formatDate } from '@/i18n/formatters';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchLocationCheck, checkIsCurrent, runLocationCheck } from "@/lib/locationCheck";
import { formatPublicLocation } from "@/lib/location";

/**
 * Profile card for the optional device location check. The saved location is
 * always labeled self-reported; the badge appears only after a successful
 * server-side check and expires after 90 days or when the city changes.
 */
export default function LocationCheckCard({ userId, savedLocation, hasUnsavedLocation }) {
  const { t, locale } = useLanguage();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const primaryArea = formatPublicLocation(savedLocation);

  const { data: check } = useQuery({
    queryKey: ["locationCheck", userId],
    queryFn: () => fetchLocationCheck(userId),
    enabled: !!userId
  });
  const current = checkIsCurrent(check, primaryArea);

  const handleCheck = async () => {
    setRunning(true);
    setOutcome(null);
    try {
      const data = await runLocationCheck();
      if (data.result === "checked") {
        setOutcome({ type: 'success', key: 'location.success', vars: { area: data.checked_area } });
        queryClient.invalidateQueries({ queryKey: ["locationCheck", userId] });
        toast.success(t('location.checked'));
      } else if (data.result === "mismatch") {
        setOutcome({ type: 'warn', key: 'location.mismatch', vars: { area: data.claimed_area } });
      } else if (data.result === "no_primary_location") {
        setOutcome({ type: 'warn', key: 'location.missing_primary' });
      } else {
        setOutcome({ type: 'warn', key: 'location.check_failed' });
      }
    } catch (err) {
      setOutcome({ type: 'warn', key: ['location.unsupported', 'location.denied', 'location.timeout', 'location.unavailable'].includes(err.message) ? err.message : 'location.check_failed' });
    }
    setRunning(false);
  };

  return (
    <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('location.status')}</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {primaryArea ? <>{primaryArea} <span className="text-gray-400">· {t('location.self')}</span></> : t('location.none')}
          </p>
        </div>
        {current && (
          <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-700 rounded-md px-2 py-1 whitespace-nowrap">
            <BadgeCheck className="w-3 h-3 mr-1" /> {t('location.checked')}
          </span>
        )}
      </div>

      {current && (
        <p className="text-xs text-gray-500">
          {t('location.checked_dates', { date: formatDate(check.checked_date, locale), expiry: formatDate(check.expires_at, locale) })}
        </p>
      )}

      <p className="text-xs text-gray-500 flex gap-1.5">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          {t('location.check_help')}
        </span>
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCheck}
        disabled={running || !primaryArea || hasUnsavedLocation}
        className="text-orange-600 border-orange-200 hover:bg-orange-50"
      >
        {running ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Crosshair className="w-4 h-4 mr-1" />}
        {t(running ? 'location.checking' : current ? 'location.renew' : 'location.check')}
      </Button>
      {hasUnsavedLocation && (
        <p className="text-xs text-amber-700">{t('location.save_first')}</p>
      )}

      {outcome && (
        <p className={`text-sm rounded-md p-2.5 ${outcome.type === "success" ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
          {t(outcome.key, outcome.vars)}
        </p>
      )}
    </div>
  );
}