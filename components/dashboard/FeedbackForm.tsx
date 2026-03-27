"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FeedbackFormProps {
  viewingId: string;
  onSubmit: (feedback: {
    attended: boolean;
    userRating?: number;
    wouldApply?: boolean;
    userFeedback?: string;
  }) => void;
}

export function FeedbackForm({ viewingId, onSubmit }: FeedbackFormProps) {
  const [attended, setAttended] = useState(true);
  const [rating, setRating] = useState(0);
  const [wouldApply, setWouldApply] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  void viewingId;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      attended,
      userRating: rating || undefined,
      wouldApply: wouldApply ?? undefined,
      userFeedback: feedback || undefined,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="p-4 bg-badge-booked-bg rounded-md text-center">
        <p className="text-sm font-medium text-success">
          Feedback submitted. Thank you!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h4 className="text-xs font-semibold text-ink-mid uppercase tracking-wide">
        Post-Viewing Feedback
      </h4>

      {/* Attended */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={attended}
          onChange={(e) => setAttended(e.target.checked)}
          className="w-4 h-4 rounded accent-accent"
        />
        <span className="text-sm text-ink">I attended this viewing</span>
      </label>

      {/* Rating */}
      {attended && (
        <>
          <div>
            <p className="text-sm text-ink-mid mb-1.5">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-0.5 cursor-pointer"
                >
                  <Star
                    size={20}
                    className={
                      n <= rating
                        ? "fill-accent text-accent"
                        : "text-border"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Would apply */}
          <div>
            <p className="text-sm text-ink-mid mb-1.5">Would you apply?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWouldApply(true)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors duration-160 cursor-pointer ${
                  wouldApply === true
                    ? "border-success bg-badge-booked-bg text-success"
                    : "border-border text-ink-mid hover:border-ink-mid"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldApply(false)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors duration-160 cursor-pointer ${
                  wouldApply === false
                    ? "border-error bg-red-50 text-error"
                    : "border-border text-ink-mid hover:border-ink-mid"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Free-form feedback */}
          <div>
            <p className="text-sm text-ink-mid mb-1.5">Notes</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="How was the viewing?"
              rows={3}
              className="w-full border-[1.5px] border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink focus:shadow-sm transition-all duration-160 resize-none"
            />
          </div>
        </>
      )}

      <Button type="submit">Submit Feedback</Button>
    </form>
  );
}
