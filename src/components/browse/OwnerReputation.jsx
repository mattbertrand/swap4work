import React from "react";
import { Star } from "lucide-react";

/**
 * Displays an owner's reputation from denormalized listing fields.
 * Shows "New member" when there are no ratings — never a fake or 0.0 rating.
 */
export default function OwnerReputation({ rating, totalRatings, className = "" }) {
  const hasRating = totalRatings > 0 && rating > 0;

  if (!hasRating) {
    return (
      <span className={`inline-flex items-center text-xs text-gray-400 ${className}`}>
        New member
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${className}`}>
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
      <span className="font-semibold text-gray-800">{Number(rating).toFixed(1)}</span>
      <span className="text-gray-400">
        · {totalRatings} {totalRatings === 1 ? "review" : "reviews"}
      </span>
    </span>
  );
}