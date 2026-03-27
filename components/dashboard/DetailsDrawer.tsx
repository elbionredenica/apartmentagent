"use client";

import type { ListingCard, CallTranscript, Viewing } from "@/types";
import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/StatusBadge";
import { TranscriptView } from "./TranscriptView";
import { FeedbackForm } from "./FeedbackForm";
import {
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Phone,
  User,
} from "lucide-react";

interface DetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  listing: ListingCard | null;
  transcripts: CallTranscript[];
  viewing: Viewing | null;
  onFeedbackSubmit: (
    viewingId: string,
    feedback: {
      attended: boolean;
      userRating?: number;
      wouldApply?: boolean;
      userFeedback?: string;
    }
  ) => void;
}

export function DetailsDrawer({
  open,
  onClose,
  listing,
  transcripts,
  viewing,
  onFeedbackSubmit,
}: DetailsDrawerProps) {
  if (!listing) return null;

  const showFeedback =
    viewing &&
    viewing.status === "completed" &&
    viewing.attended == null;

  return (
    <Drawer open={open} onClose={onClose} title={listing.address}>
      {/* Listing info */}
      <div className="flex flex-wrap gap-4 mb-6">
        <StatusBadge status={listing.status} />
        <div className="flex items-center gap-1.5 text-sm text-ink-mid">
          <DollarSign size={14} />
          <span>${listing.rent.toLocaleString()}/mo</span>
        </div>
        {listing.bedrooms != null && (
          <div className="flex items-center gap-1.5 text-sm text-ink-mid">
            <Bed size={14} />
            <span>{listing.bedrooms} bed</span>
          </div>
        )}
        {listing.bathrooms != null && (
          <div className="flex items-center gap-1.5 text-sm text-ink-mid">
            <Bath size={14} />
            <span>{listing.bathrooms} bath</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mb-6 text-sm text-ink-mid">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} />
          <span>
            {listing.address}, {listing.city}
          </span>
        </div>
        {listing.propertyManager && (
          <div className="flex items-center gap-1.5">
            <User size={14} />
            <span>{listing.propertyManager}</span>
          </div>
        )}
        {listing.phone && (
          <div className="flex items-center gap-1.5">
            <Phone size={14} />
            <span>{listing.phone}</span>
          </div>
        )}
      </div>

      {listing.description && (
        <p className="text-sm text-ink mb-6 leading-relaxed">
          {listing.description}
        </p>
      )}

      {/* Failure reason */}
      {listing.status === "failed" && listing.failureReason && (
        <div className="p-3 bg-red-50 rounded-md mb-6">
          <p className="text-sm text-error">
            <span className="font-medium">Not a fit:</span>{" "}
            {listing.failureReason.replace(/_/g, " ")}
          </p>
        </div>
      )}

      {/* Transcripts */}
      {transcripts.length > 0 && (
        <div className="flex flex-col gap-6 mb-6">
          {transcripts.map((t) => (
            <TranscriptView key={t.id} transcript={t} />
          ))}
        </div>
      )}

      {/* Feedback form */}
      {showFeedback && viewing && (
        <FeedbackForm
          viewingId={viewing.id}
          onSubmit={(feedback) => onFeedbackSubmit(viewing.id, feedback)}
        />
      )}
    </Drawer>
  );
}
