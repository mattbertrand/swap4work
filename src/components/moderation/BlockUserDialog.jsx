import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
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
import { useLanguage } from "@/i18n/LanguageContext";

export default function BlockUserDialog({
  open,
  onClose,
  currentUser,
  blockedUserId,
  blockedUserName,
  onBlocked,
}) {
  const { t } = useLanguage();
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
      toast.success(t("block.success", { name: displayName(blockedUserName) }));
      onBlocked?.();
      onClose();
    } catch (error) {
      toast.error(t("block.error"));
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
            {t("block.title", { name: displayName(blockedUserName) })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("block.desc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={submitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("block.blocking")}
              </>
            ) : (
              t("block.action")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}