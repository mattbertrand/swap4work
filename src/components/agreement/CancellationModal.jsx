import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileWarning } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/i18n/LanguageContext";

const DISPUTE_REASONS = [
  { value: "owner_withdrew_item", labelKey: "cancel.d_owner" },
  { value: "worker_stopped_working", labelKey: "cancel.d_worker" },
  { value: "item_condition_changed", labelKey: "cancel.d_condition" },
  { value: "work_quality", labelKey: "cancel.d_quality" },
  { value: "hours_dispute", labelKey: "cancel.d_hours" },
  { value: "no_show", labelKey: "cancel.d_noshow" },
  { value: "other", labelKey: "cancel.d_other" },
];

export default function CancellationModal({ open, onClose, agreement, onRequestCancellation, onOpenDispute, isOfferer, isWorker }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("request"); // "request" or "dispute"
  const [reason, setReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [description, setDescription] = useState("");

  const workHasStarted = agreement.hours_logged > 0 || agreement.is_locked;

  const handleRequestCancellation = () => {
    onRequestCancellation({
      reason,
      requested_date: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    });
    onClose();
  };

  const handleOpenDispute = () => {
    onOpenDispute({
      reason: disputeReason,
      description
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            {mode === "request" ? t("cancel.request_title") : t("cancel.dispute_title")}
          </DialogTitle>
          <DialogDescription>
            {mode === "request"
              ? workHasStarted
                ? t("cancel.desc_started")
                : t("cancel.desc_request")
              : t("cancel.desc_dispute")
            }
          </DialogDescription>
        </DialogHeader>

        {workHasStarted && mode === "request" && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              {t("cancel.hours_alert", { hours: agreement.hours_logged })}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {mode === "request" ? (
            <>
              <div>
                <Label htmlFor="reason">{t("cancel.reason_label")}</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("cancel.reason_ph")}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="disputeReason">{t("cancel.dispute_reason")}</Label>
                <Select value={disputeReason} onValueChange={setDisputeReason}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t("cancel.select_reason")} />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPUTE_REASONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">{t("cancel.details")}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("cancel.details_ph")}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === "request" ? (
            <>
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                {t("common.cancel")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("dispute")}
                className="w-full sm:w-auto"
              >
                <FileWarning className="w-4 h-4 mr-2" />
                {t("cancel.open_instead")}
              </Button>
              <Button
                onClick={handleRequestCancellation}
                disabled={!reason.trim()}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
              >
                {t("cancel.request_mutual")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode("request")} className="w-full sm:w-auto">
                {t("cancel.back")}
              </Button>
              <Button
                onClick={handleOpenDispute}
                disabled={!disputeReason || !description.trim()}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                {t("cancel.submit_dispute")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}