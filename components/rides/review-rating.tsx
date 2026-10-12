"use client";
import { useState } from "react";
import { Star } from "lucide-react";
export function ReviewRating() {
  const [rating, setRating] = useState(5);
  return (
    <fieldset>
      <legend className="mb-3 text-sm text-muted-foreground">
        Your rating
      </legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="relative cursor-pointer rounded-lg p-2 has-focus-visible:ring-2 has-focus-visible:ring-primary"
          >
            <input
              className="sr-only"
              type="radio"
              name="rating"
              value={n}
              checked={rating === n}
              onChange={() => setRating(n)}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            />
            <Star
              size={26}
              aria-hidden="true"
              className={
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              }
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
