import React, { useState } from "react";
import { displayName } from "@/lib/names";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/duration";
import { Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OfferCard({ offer, isOwnOffer, onAccept, onCounter, onDecline, canRespond }) {
  const { t } = useLanguage();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Card className={`border-2 ${isOwnOffer ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${isOwnOffer ? 'text-blue-600' : 'text-orange-600'}`} />
            <div>
              <p className="font-semibold text-gray-900">{displayName(offer.offered_by_name)}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(offer.timestamp), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
          {isOwnOffer && (
            <Badge className="bg-blue-100 text-blue-700">{t("offer.your_offer")}</Badge>
          )}
        </div>

        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">{formatDuration(offer.hours)}</span>
          </div>
          {offer.work_type && (
            <p className="text-sm text-gray-700">
              <strong>{t("offer.work_type")}:</strong> {offer.work_type}
            </p>
          )}
          {offer.message && (
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
              {offer.message}
            </p>
          )}
        </div>

        {!isOwnOffer && canRespond && (
          <div className="flex gap-2">
            <Button
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t("offer.accept")}
            </Button>
            <Button
              onClick={onCounter}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t("offer.counter")}
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t("offer.decline")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("offer.decline_title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("offer.decline_desc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setConfirmOpen(false);
                      onDecline();
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t("offer.yes_decline")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {isOwnOffer && canRespond && (
          <p className="text-xs text-center text-gray-500">
            {t("offer.waiting")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}