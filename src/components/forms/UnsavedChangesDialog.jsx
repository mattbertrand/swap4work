import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmation dialog shown when the useUnsavedChanges hook blocks an in-app
 * navigation because the current form has unsaved changes.
 */
export default function UnsavedChangesDialog({ blocker }) {
  if (!blocker || blocker.state !== "blocked") return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) blocker.reset(); }}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>You have unsaved changes</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this page? Your changes will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => blocker.reset()}>
            Stay
          </Button>
          <Button variant="destructive" onClick={() => blocker.proceed()}>
            Leave without saving
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}