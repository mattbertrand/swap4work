import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HoursMinutesInput from "@/components/forms/HoursMinutesInput";
import { formatDuration } from "@/lib/duration";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CounterOfferModal({
  open,
  onClose,
  currentOffer,
  suggestedHours,
  onSubmit,
  defaultHours = null,
  defaultWorkType = "",
  title = null,
  submitLabel = null,
  onAccept = null
}) {
  const { t } = useLanguage();
  const [hours, setHours] = useState(null);
  const [workType, setWorkType] = useState("");
  const [message, setMessage] = useState("");

  // Auto-populate when modal opens
  useEffect(() => {
    if (open) {
      // Set default hours (either passed default or current offer)
      setHours(defaultHours || currentOffer || null);
      setWorkType(defaultWorkType || "");
    }
  }, [open, defaultHours, defaultWorkType, currentOffer]);

  const handleSubmit = () => {
    if (!hours) {
      alert(t("cof.invalid_time"));
      return;
    }

    onSubmit({
      hours,
      work_type: workType,
      message
    });

    // Reset and close
    setHours(null);
    setWorkType("");
    setMessage("");
    onClose();
  };

  const handleClose = () => {
    // Reset on close
    setHours(null);
    setWorkType("");
    setMessage("");
    onClose();
  };

  const difference = hours && currentOffer ? hours - currentOffer : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            {title || t("cof.title")}
          </DialogTitle>
          <DialogDescription>
            {t("cof.desc", { duration: formatDuration(currentOffer) })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {suggestedHours && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-900">
                💡 {t("cof.ai_suggestion", {
                  min: formatDuration(suggestedHours[0]),
                  max: formatDuration(suggestedHours[1])
                })}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="hours">{t("cof.time_offered")} *</Label>
            <HoursMinutesInput
              id="hours"
              value={hours}
              onChange={setHours}
            />
            {difference !== 0 && hours && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                difference > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {difference > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {formatDuration(Math.abs(difference))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="workType">{t("cof.work_type")}</Label>
            <Input
              id="workType"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              placeholder={t("cof.work_type_ph")}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="message">{t("cof.message")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("cof.message_ph")}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          {onAccept && (
            <Button
              onClick={() => { handleClose(); onAccept(); }}
              className="bg-green-600 hover:bg-green-700"
            >
              {t("cof.accept_asis")}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!hours}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitLabel || t("cof.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}