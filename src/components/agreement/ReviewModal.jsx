import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const STAR_LABEL_KEYS = {
  5: "review.stars_5",
  4: "review.stars_4",
  3: "review.stars_3",
  2: "review.stars_2",
  1: "review.stars_1",
};

export default function ReviewModal({
  open,
  onClose,
  otherUserName,
  onSubmit,
  isSubmitting
}) {
  const { t } = useLanguage();
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (stars === 0) {
      alert(t("review.select_rating"));
      return;
    }
    if (submitted) return;
    setSubmitted(true);
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
          <DialogTitle className="text-xl">{t("review.title")}</DialogTitle>
          <DialogDescription>
            {t("review.desc", { name: otherUserName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <Label className="text-base font-semibold">{t("review.rating")}</Label>
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
                {t(STAR_LABEL_KEYS[stars])}
              </p>
            )}
          </div>

          {/* Written Review */}
          <div>
            <Label htmlFor="review">{t("review.written")}</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={t("review.written_ph")}
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {t("review.skip")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={stars === 0 || isSubmitting || submitted}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting || submitted ? t("review.submitting") : t("review.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}