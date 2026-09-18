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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SuspendUserDialog({ open, onClose, targetUser, action }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!targetUser || !action) return null;

  const isUnsuspend = action === "unsuspend";
  const actionLabel = isUnsuspend ? "Reinstate" : action === "ban" ? "Ban" : "Suspend";

  const handleSubmit = async () => {
    if (!isUnsuspend && !reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke("suspendUser", {
        user_id: targetUser.id,
        action,
        reason: reason.trim(),
      });
      toast.success(
        isUnsuspend
          ? `${targetUser.full_name} has been reinstated — their listings and profile are visible again`
          : `${targetUser.full_name} has been ${action === "ban" ? "banned" : "suspended"} — their listings and profile are hidden from browse views`
      );
      await queryClient.invalidateQueries();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {actionLabel} {targetUser.full_name}?
          </DialogTitle>
          <DialogDescription>
            {isUnsuspend
              ? "Their listings and worker profile will become visible in browse views again."
              : "Their listings and worker profile will be hidden from browse views. Open negotiations and agreements are unaffected, and the action is logged in the moderation history."}
          </DialogDescription>
        </DialogHeader>

        {!isUnsuspend && (
          <div className="py-2">
            <Label htmlFor="suspend-reason">Reason (required, logged in moderation history)</Label>
            <Textarea
              id="suspend-reason"
              placeholder="Why is this member being moderated?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className={isUnsuspend ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {loading ? "Working..." : `${actionLabel} User`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}