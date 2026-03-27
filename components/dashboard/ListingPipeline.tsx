"use client";

import type { ListingCard } from "@/types";
import type { ListingStatus } from "@/types";
import { ListingPipelineCard } from "./ListingPipelineCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2 } from "lucide-react";

interface ListingPipelineProps {
  listings: ListingCard[];
  onSelect: (listing: ListingCard) => void;
}

// Active states first, then terminal
const STATE_ORDER: Record<ListingStatus, number> = {
  prescreening: 0,
  deepscreening: 1,
  prescreened: 2,
  queued_for_deepscreen: 3,
  deepscreened: 4,
  ready_for_booking: 5,
  queued_for_prescreen: 6,
  discovered: 7,
  criteria_checked: 8,
  booked: 9,
  voicemail_pending: 10,
  failed: 11,
};

export function ListingPipeline({
  listings,
  onSelect,
}: ListingPipelineProps) {
  const sorted = [...listings].sort(
    (a, b) => STATE_ORDER[a.status] - STATE_ORDER[b.status]
  );

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        message="No listings yet — agent is getting started"
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-ink-mid uppercase tracking-wide">
          Listings ({listings.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((listing) => (
          <ListingPipelineCard
            key={listing.id}
            listing={listing}
            onClick={() => onSelect(listing)}
          />
        ))}
      </div>
    </div>
  );
}
