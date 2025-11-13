import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

export default function ReviewModal({ 
  open, 
  onClose, 
  otherUserName,
  onSubmit,
  isSubmitting 
}) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = () => {
    if (stars === 0) {
      alert("Please select a rating");
      return;
    }
    onSubmit({ stars, review });
  };

  const handleClose = () => {
    setStars(0);
    setHoveredStar(0);
    setReview("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience working with {otherUserName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <Label className="text-base font-semibold">Your Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredStar || stars)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="text-sm text-gray-600">
                {stars === 5 && "Excellent! 🎉"}
                {stars === 4 && "Very Good! 👍"}
                {stars === 3 && "Good 👌"}
                {stars === 2 && "Fair 😐"}
                {stars === 1 && "Poor 😞"}
              </p>
            )}
          </div>

          {/* Written Review */}
          <div>
            <Label htmlFor="review">Written Review (optional)</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience working together..."
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Skip for Now
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={stars === 0 || isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}