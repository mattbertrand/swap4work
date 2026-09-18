import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const DELETE_LABELS = {
  listings: "Listings",
  worker_profile: "Worker profile",
  messages: "Messages",
  notifications: "Notifications",
  waitlist_entries: "Waitlist entries",
  blocked_user_entries: "Block list entries",
  terms_acceptances: "Terms acceptances",
  reviews_given: "Reviews they wrote",
  reviews_received: "Reviews about them",
  karma_transactions: "Karma history",
  reports_filed: "Reports they filed",
  in_progress_agreements: "In-progress agreements (cancelled, items re-released)",
};

export default function DeleteUserDialog({ open, onClose, targetUser, preview, previewLoading }) {
  const [step, setStep] = useState("confirm");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setStep("confirm");
      setReason("");
      setConfirmText("");
      setResult(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("deleteUser", {
        user_id: targetUser.id,
        mode: "execute",
        reason: reason.trim(),
      });
      setResult(res.data);
      setStep("done");
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Deletion failed");
    } finally {
      setLoading(false);
    }
  };

  if (!targetUser) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>Delete {targetUser.full_name} &amp; all their data?</DialogTitle>
              <DialogDescription>
                This permanently removes the member and their records from the community. This cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {previewLoading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : preview ? (
                <>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800 mb-2">Will be deleted:</p>
                    <ul className="space-y-1 text-sm text-red-700">
                      {Object.entries(preview.will_delete || {}).map(([key, count]) => (
                        <li key={key} className="flex justify-between">
                          <span>{DELETE_LABELS[key] || key}</span>
                          <span className="font-semibold">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Will be kept:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex justify-between">
                        <span>Completed agreements (name shown as "Deleted user")</span>
                        <span className="font-semibold">
                          {preview.will_keep?.completed_agreements ?? 0}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {(preview.counterparties || []).length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                      {preview.counterparties.length} member
                      {preview.counterparties.length > 1 ? "s" : ""} with a cancelled agreement will be
                      notified and their item(s) released for new offers.
                    </div>
                  )}
                </>
              ) : null}

              <div>
                <Label htmlFor="delete-reason">Reason (logged in the deletion record)</Label>
                <Textarea
                  id="delete-reason"
                  placeholder="Why is this member being removed?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="delete-confirm">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-500">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  The login account itself must be removed afterwards in the dashboard's App Users
                  section — app code cannot delete accounts.
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || confirmText !== "DELETE"}
              >
                {loading ? "Deleting..." : "Delete User & Data"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                User deleted
              </DialogTitle>
              <DialogDescription>
                {targetUser.full_name} and their data have been removed from the community.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm text-gray-600">
              {result?.counterparties_notified > 0 && (
                <p>
                  {result.counterparties_notified} member
                  {result.counterparties_notified > 1 ? "s" : ""} notified about the cancelled
                  agreement{result.counterparties_notified > 1 ? "s" : ""}.
                </p>
              )}
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                Last step: remove the login account in the dashboard (App Users → the member →
                delete) so they can no longer sign in.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}