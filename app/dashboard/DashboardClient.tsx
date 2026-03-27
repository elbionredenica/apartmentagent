"use client";

import { useState, useCallback } from "react";
import type { ListingCard, CallTranscript, Viewing } from "@/types";
import { mockListings, mockViewings, mockTranscripts } from "@/lib/mock-data";
import { ListingPipeline } from "@/components/dashboard/ListingPipeline";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { DetailsDrawer } from "@/components/dashboard/DetailsDrawer";
import { ChatBar } from "@/components/dashboard/ChatBar";

export function DashboardClient() {
  const [listings] = useState<ListingCard[]>(mockListings);
  const [viewings] = useState<Viewing[]>(mockViewings);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingCard | null>(
    null
  );
  const [selectedTranscripts, setSelectedTranscripts] = useState<
    CallTranscript[]
  >([]);
  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);

  const openDrawerForListing = useCallback(
    (listing: ListingCard) => {
      setSelectedListing(listing);
      // Find transcripts for this listing
      const transcripts = mockTranscripts.filter(
        (t) => t.listingId === listing.listingId
      );
      setSelectedTranscripts(transcripts);
      // Find viewing for this listing
      const viewing =
        viewings.find((v) => v.listingId === listing.listingId) ?? null;
      setSelectedViewing(viewing);
      setDrawerOpen(true);
    },
    [viewings]
  );

  const openDrawerForViewing = useCallback(
    (viewing: Viewing) => {
      // Find the listing card for this viewing
      const listing =
        listings.find((l) => l.listingId === viewing.listingId) ?? null;
      if (listing) {
        openDrawerForListing(listing);
      }
    },
    [listings, openDrawerForListing]
  );

  const handleFeedbackSubmit = useCallback(
    (
      viewingId: string,
      feedback: {
        attended: boolean;
        userRating?: number;
        wouldApply?: boolean;
        userFeedback?: string;
      }
    ) => {
      // Mode A: log to console. Mode B: PATCH /api/viewings/:id/feedback
      console.log("Feedback submitted:", viewingId, feedback);
    },
    []
  );

  return (
    <div className="flex h-full relative">
      {/* Sidebar */}
      <div className="w-80 shrink-0 border-r border-border overflow-y-auto">
        <ListingPipeline
          listings={listings}
          onSelect={openDrawerForListing}
        />
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden">
        <CalendarView
          viewings={viewings}
          onEventClick={openDrawerForViewing}
        />
      </div>

      {/* Details drawer */}
      <DetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        listing={selectedListing}
        transcripts={selectedTranscripts}
        viewing={selectedViewing}
        onFeedbackSubmit={handleFeedbackSubmit}
      />

      {/* Chat bar */}
      <ChatBar listings={listings} />
    </div>
  );
}
