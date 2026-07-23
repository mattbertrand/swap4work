import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BlockUserDialog({
  open,
  onClose,
  currentUser,
  blockedUserId,
  blockedUserName,
  onBlocked,
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleBlock = async () => {
    if (!currentUser || !blockedUserId) return;
    setSubmitting(true);
    try {
      await base44.entities.BlockedUser.create({
        blocker_id: currentUser.id,
        blocked_id: blockedUserId,
        blocked_name: blockedUserName || "",
        blocked_photo_url: "",
      });
      toast.success(`${blockedUserName} has been blocked`);
      onBlocked?.();
      onClose();
    } catch (error) {
      toast.error("Failed to block user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-orange-600" />
            Block {blockedUserName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Once blocked, neither of you can message or negotiate with each
            other. Their listings will disappear from your search results, and
            any existing negotiations will become read-only. You can unblock
            them anytime from your Profile settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={submitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Blocking...
              </>
            ) : (
              "Block User"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}