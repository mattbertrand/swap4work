import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Crosshair, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
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
        setOutcome({ type: "success", text: `Location checked — your device is in ${data.checked_area}.` });
        queryClient.invalidateQueries({ queryKey: ["locationCheck", userId] });
        toast.success("Location checked");
      } else if (data.result === "mismatch") {
        setOutcome({ type: "warn", text: `Your device doesn't appear to be near ${data.claimed_area} right now, so no badge was added. You can keep using Swap4Work, and try again from home if you like.` });
      } else if (data.result === "no_primary_location") {
        setOutcome({ type: "warn", text: "Save a city, state and ZIP code on your profile first, then run the check." });
      } else {
        setOutcome({ type: "warn", text: "We couldn't complete the check right now. Please try again later." });
      }
    } catch (err) {
      const message = err?.response?.data?.error || err.message || "We couldn't complete the check right now.";
      setOutcome({ type: "warn", text: message });
    }
    setRunning(false);
  };

  return (
    <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Location status</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {primaryArea ? <>{primaryArea} <span className="text-gray-400">· self-reported</span></> : "No saved location yet"}
          </p>
        </div>
        {current && (
          <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-700 rounded-md px-2 py-1 whitespace-nowrap">
            <BadgeCheck className="w-3 h-3 mr-1" /> Location checked
          </span>
        )}
      </div>

      {current && (
        <p className="text-xs text-gray-500">
          Checked {format(new Date(check.checked_date), "MMM d, yyyy")} · expires {format(new Date(check.expires_at), "MMM d, yyyy")}
        </p>
      )}

      <p className="text-xs text-gray-500 flex gap-1.5">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          Optional. We compare your device's current location with your saved city, then keep only the area and date —
          never your coordinates. It shows you were in this area at the time; it isn't proof of where you live.
          The badge expires after 90 days or if you change your city.
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
        {running ? "Checking..." : current ? "Renew location check" : "Check my location"}
      </Button>
      {hasUnsavedLocation && (
        <p className="text-xs text-amber-700">Save your profile changes first — the check compares against your saved city.</p>
      )}

      {outcome && (
        <p className={`text-sm rounded-md p-2.5 ${outcome.type === "success" ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
          {outcome.text}
        </p>
      )}
    </div>
  );
}