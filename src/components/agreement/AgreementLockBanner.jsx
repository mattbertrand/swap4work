import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { displayName } from "@/lib/names";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AgreementLockBanner({ agreement, user, onRequestCancellation, onRespondToCancellation }) {
  const { t, lang } = useLanguage();
  const isOfferer = user?.id === agreement.offerer_id;
  const isWorker = user?.id === agreement.worker_id;

  const cancellationRequest = agreement.cancellation_request;
  const hasPendingCancellation = cancellationRequest?.status === "pending_mutual";
  const requestedByMe = cancellationRequest?.requested_by === user?.id;

  if (agreement.status === "locked" || agreement.status === "in_progress") {
    return (
      <div className="space-y-3">
        <Alert className="bg-blue-50 border-blue-200">
          <Lock className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>{t("lock.locked")}</strong> — {t("lock.locked_desc")}
            {isOfferer && ` ${t("lock.cannot_edit")}`}
          </AlertDescription>
        </Alert>

        {hasPendingCancellation && (
          <Alert className="bg-orange-50 border-orange-200">
            <Clock className="w-4 h-4 text-orange-600" />
            <AlertDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">
                    {t("lock.requested", {
                      name: requestedByMe ? t("lock.you") : displayName(cancellationRequest.requested_by_name)
                    })}
                  </p>
                  <p className="text-sm text-orange-700 mb-2">
                    {cancellationRequest.reason}
                  </p>
                  <p className="text-xs text-orange-600">
                    {t("lock.expires", {
                      date: new Date(cancellationRequest.expires_at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US"),
                      time: new Date(cancellationRequest.expires_at).toLocaleTimeString(lang === "es" ? "es-ES" : "en-US")
                    })}
                  </p>
                </div>
                {!requestedByMe && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRespondToCancellation(false)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {t("lock.reject")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onRespondToCancellation(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {t("lock.approve")}
                    </Button>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {agreement.hours_logged > 0 && !hasPendingCancellation && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>{t("lock.in_progress")}</strong> — {t("lock.in_progress_desc", { hours: agreement.hours_logged })}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return null;
}