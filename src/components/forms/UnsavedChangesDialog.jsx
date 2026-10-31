import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Confirmation dialog shown when the useUnsavedChanges hook blocks an in-app
 * navigation because the current form has unsaved changes.
 */
export default function UnsavedChangesDialog({ blocker }) {
  const { t } = useLanguage();
  if (!blocker || blocker.state !== "blocked") return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) blocker.reset(); }}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t("unsaved.title")}</DialogTitle>
          <DialogDescription>
            {t("unsaved.desc")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => blocker.reset()}>
            {t("unsaved.stay")}
          </Button>
          <Button variant="destructive" onClick={() => blocker.proceed()}>
            {t("unsaved.leave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}