import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { authLoginUrl } from "@/lib/authNavigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REASON_OPTIONS = [
  { value: "scam_fraud", label: "Scam / Fraud" },
  { value: "fake_listing", label: "Fake Listing" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "spam", label: "Spam" },
  { value: "safety_concern", label: "Safety Concern" },
  { value: "other", label: "Other" },
];

export default function ReportModal({
  open,
  onClose,
  currentUser,
  targetType,
  targetId,
  targetName,
  reportedUserId,
  reportedUserName,
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setReason("");
      setDescription("");
      setAlsoBlock(false);
      setSuccess(false);
    }
  }, [open]);

  const canShowBlockOption =
    reportedUserId && currentUser && reportedUserId !== currentUser.id;

  const handleSubmit = async () => {
    if (!reason || !currentUser) return;
    setSubmitting(true);
    try {
      await base44.entities.Report.create({
        reporter_id: currentUser.id,
        reporter_name: currentUser.full_name,
        target_type: targetType,
        target_id: targetId,
        target_title: targetName || "",
        reported_user_id: reportedUserId || "",
        reported_user_name: reportedUserName || "",
        reason,
        description: description.trim(),
        status: "open",
      });

      if (alsoBlock && canShowBlockOption) {
        await base44.entities.BlockedUser.create({
          blocker_id: currentUser.id,
          blocked_id: reportedUserId,
          blocked_name: reportedUserName || "",
          blocked_photo_url: "",
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const targetLabel =
    targetType === "user"
      ? reportedUserName || targetName
      : targetName || "this content";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Report Submitted
            </h3>
            <p className="text-gray-600 text-sm">
              Thank you. Our moderation team will review this report and take
              appropriate action.
            </p>
          </div>
        ) : !currentUser ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Report {targetLabel}
              </DialogTitle>
              <DialogDescription>
                You need to be signed in to report {targetLabel}. Sign in to
                help keep Swap4Work safe.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => navigate(authLoginUrl(window.location.pathname + window.location.search))}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Sign in to report
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Report {targetLabel}
              </DialogTitle>
              <DialogDescription>
                Help us keep Swap4Work safe. Tell us what's wrong and our team
                will review it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Provide additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>

              {canShowBlockOption && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="also-block"
                    checked={alsoBlock}
                    onCheckedChange={setAlsoBlock}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="also-block"
                    className="text-sm text-gray-700 cursor-pointer leading-tight"
                  >
                    Also block {reportedUserName}. They won't be able to message
                    or negotiate with you, and their listings will be hidden
                    from your search results.
                  </label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}