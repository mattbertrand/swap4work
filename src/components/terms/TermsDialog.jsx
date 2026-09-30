import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TermsContent from "@/components/terms/TermsContent";

// In-app overlay for reading Terms & Conditions. Keeps the user inside the
// current page — closing returns them exactly where they left off (form
// state, checkbox and scroll position are untouched).
export default function TermsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms &amp; Conditions</DialogTitle>
          <DialogDescription>
            Close this window to return right where you left off.
          </DialogDescription>
        </DialogHeader>
        <TermsContent />
      </DialogContent>
    </Dialog>
  );
}