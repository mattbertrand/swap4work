import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { displayName } from "@/lib/names";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgreementLockBanner({ agreement, user, onRequestCancellation, onRespondToCancellation }) {
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
            <strong>Agreement Locked</strong> — This item is reserved for an ongoing work agreement. 
            {isOfferer && " The item cannot be edited or deleted while work is in progress."}
          </AlertDescription>
        </Alert>

        {hasPendingCancellation && (
          <Alert className="bg-orange-50 border-orange-200">
            <Clock className="w-4 h-4 text-orange-600" />
            <AlertDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">
                    {requestedByMe ? "You" : displayName(cancellationRequest.requested_by_name)} requested cancellation
                  </p>
                  <p className="text-sm text-orange-700 mb-2">
                    {cancellationRequest.reason}
                  </p>
                  <p className="text-xs text-orange-600">
                    Expires: {new Date(cancellationRequest.expires_at).toLocaleDateString()} at {new Date(cancellationRequest.expires_at).toLocaleTimeString()}
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
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onRespondToCancellation(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
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
              <strong>Work in Progress</strong> — {agreement.hours_logged} hours logged. 
              Cancelling now requires mutual agreement and may affect reliability scores.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return null;
}