import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileWarning } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CancellationModal({ open, onClose, agreement, onRequestCancellation, onOpenDispute, isOfferer, isWorker }) {
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
            {mode === "request" ? "Request Cancellation" : "Open Dispute"}
          </DialogTitle>
          <DialogDescription>
            {mode === "request" 
              ? workHasStarted 
                ? "Work has started on this agreement. Cancelling without mutual consent may affect your trust rating."
                : "Request to cancel this agreement before work has started."
              : "Open a formal dispute to resolve disagreements about this agreement."
            }
          </DialogDescription>
        </DialogHeader>

        {workHasStarted && mode === "request" && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              <strong>{agreement.hours_logged} hours</strong> have been logged. Cancelling now requires mutual agreement or may result in karma penalties.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {mode === "request" ? (
            <>
              <div>
                <Label htmlFor="reason">Reason for Cancellation</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to cancel..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="disputeReason">Dispute Reason</Label>
                <Select value={disputeReason} onValueChange={setDisputeReason}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner_withdrew_item">Owner withdrew item</SelectItem>
                    <SelectItem value="worker_stopped_working">Worker stopped working</SelectItem>
                    <SelectItem value="item_condition_changed">Item condition changed</SelectItem>
                    <SelectItem value="work_quality">Work quality issues</SelectItem>
                    <SelectItem value="hours_dispute">Hours dispute</SelectItem>
                    <SelectItem value="no_show">No show</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Details</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about the dispute..."
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
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMode("dispute")}
                className="w-full sm:w-auto"
              >
                <FileWarning className="w-4 h-4 mr-2" />
                Open Dispute Instead
              </Button>
              <Button 
                onClick={handleRequestCancellation}
                disabled={!reason.trim()}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
              >
                Request Mutual Cancellation
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode("request")} className="w-full sm:w-auto">
                Back
              </Button>
              <Button 
                onClick={handleOpenDispute}
                disabled={!disputeReason || !description.trim()}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                Submit Dispute
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}