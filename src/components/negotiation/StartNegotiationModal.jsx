import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Package, Loader2 } from "lucide-react";
import HoursMinutesInput from "@/components/forms/HoursMinutesInput";
import { formatDuration } from "@/lib/duration";

export default function StartNegotiationModal({ open, onClose, item, onConfirm, loading }) {
  const [hours, setHours] = useState(item?.required_hours || null);
  const [workType, setWorkType] = useState("");
  const [message, setMessage] = useState("");

  // Reset when modal opens
  React.useEffect(() => {
    if (open && item) {
      setHours(item.required_hours);
      setWorkType("");
      setMessage("");
    }
  }, [open, item?.required_hours]);

  const handleConfirm = () => {
    if (!hours) return;
    onConfirm({
      hours,
      work_type: workType,
      message
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Review Your Offer
          </DialogTitle>
          <DialogDescription>
            You're offering to work in exchange for <strong>{item?.title}</strong>. Review and confirm your offer details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 font-medium">Item requested: {formatDuration(item?.required_hours)}</p>
          </div>

          <div>
            <Label htmlFor="start-hours">Time You're Offering <span className="text-red-500">*</span></Label>
            <HoursMinutesInput
              id="start-hours"
              value={hours}
              onChange={setHours}
            />
          </div>

          <div>
            <Label htmlFor="start-work-type">Type of Work (optional)</Label>
            <Input
              id="start-work-type"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              placeholder="e.g., Lawn mowing, Painting, Cleaning"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="start-message">Message (optional)</Label>
            <Textarea
              id="start-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself and explain your offer..."
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hours || loading}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Confirm Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}