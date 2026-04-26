import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CounterOfferModal({ 
  open, 
  onClose, 
  currentOffer, 
  suggestedHours, 
  onSubmit,
  defaultHours = null,
  defaultWorkType = "",
  title = "Make a Counter Offer",
  submitLabel = "Send Counter Offer",
  onAccept = null
}) {
  const [hours, setHours] = useState("");
  const [workType, setWorkType] = useState("");
  const [message, setMessage] = useState("");

  // Auto-populate when modal opens
  useEffect(() => {
    if (open) {
      console.log('🔢 Counter Offer Modal opened with defaults:', {
        defaultHours,
        defaultWorkType,
        currentOffer
      });
      
      // Set default hours (either passed default or current offer)
      const initialHours = defaultHours || currentOffer || "";
      setHours(initialHours.toString());
      
      // Set default work type
      setWorkType(defaultWorkType || "");
      
      console.log('✅ Pre-filled fields:', {
        hours: initialHours,
        workType: defaultWorkType || ""
      });
    }
  }, [open, defaultHours, defaultWorkType, currentOffer]);

  const handleSubmit = () => {
    if (!hours || parseFloat(hours) <= 0) {
      alert("Please enter valid hours");
      return;
    }

    console.log('📤 Submitting counter offer:', {
      hours: parseFloat(hours),
      work_type: workType,
      message
    });

    onSubmit({
      hours: parseFloat(hours),
      work_type: workType,
      message
    });

    // Reset and close
    setHours("");
    setWorkType("");
    setMessage("");
    onClose();
  };

  const handleClose = () => {
    // Reset on close
    setHours("");
    setWorkType("");
    setMessage("");
    onClose();
  };

  const difference = hours && currentOffer ? parseFloat(hours) - currentOffer : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Current offer is {currentOffer} hours. What would you like to propose?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {suggestedHours && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-900">
                💡 <strong>AI Suggestion:</strong> Similar items trade for {suggestedHours[0]}–{suggestedHours[1]} hours
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="hours">Hours Offered *</Label>
            <div className="relative">
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 8.5"
                className="mt-2 pr-16"
              />
              {difference !== 0 && hours && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-medium ${
                  difference > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {difference > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(difference)}h
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="workType">Type of Work (optional)</Label>
            <Input
              id="workType"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              placeholder="e.g., Moving, Cleaning, Gardening"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note to explain your offer..."
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {onAccept && (
            <Button
              onClick={() => { handleClose(); onAccept(); }}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept As-Is
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            disabled={!hours || parseFloat(hours) <= 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}