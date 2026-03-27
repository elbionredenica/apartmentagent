"use client";

import type { ListingCard } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Clock } from "lucide-react";

interface ListingPipelineCardProps {
  listing: ListingCard;
  onClick: () => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ListingPipelineCard({
  listing,
  onClick,
}: ListingPipelineCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 border-b border-border hover:bg-off-white transition-colors duration-160 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink truncate flex-1">
          {listing.address}
        </p>
        <StatusBadge status={listing.status} />
      </div>

      <div className="flex items-center gap-3 mt-2">
        <span className="text-sm text-ink-mid">
          ${listing.rent.toLocaleString()}/mo
        </span>
        {listing.bedrooms != null && (
          <span className="text-sm text-ink-muted">
            {listing.bedrooms}BR
          </span>
        )}
        {listing.overallScore != null && (
          <span className="text-sm font-medium text-accent">
            Score: {listing.overallScore}
          </span>
        )}
      </div>

      {listing.status === "failed" && listing.failureReason && (
        <p className="text-xs text-error mt-1.5">
          {listing.failureReason.replace(/_/g, " ")}
        </p>
      )}

      <div className="flex items-center gap-1 mt-2 text-xs text-ink-muted">
        <Clock size={12} />
        <span>{formatTimestamp(listing.lastUpdatedAt)}</span>
      </div>
    </button>
  );
}
