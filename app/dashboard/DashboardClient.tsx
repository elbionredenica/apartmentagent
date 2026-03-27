"use client";

import { useState, useCallback, useEffect } from "react";
import type { ListingCard, CallTranscript, Viewing, User } from "@/types";
import { ListingPipeline } from "@/components/dashboard/ListingPipeline";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { DetailsDrawer } from "@/components/dashboard/DetailsDrawer";
import { ChatBar } from "@/components/dashboard/ChatBar";

export function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load dashboard");
        }

        const data = await response.json();
        if (cancelled) return;

        setUser(data.user ?? null);
        setListings(data.listings ?? []);
        setViewings(data.viewings ?? []);
        setTranscripts(data.transcripts ?? []);
      } catch (error) {
        console.error("Dashboard load failed:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    const interval = setInterval(loadDashboard, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingCard | null>(
    null
  );
  const [selectedTranscripts, setSelectedTranscripts] = useState<
    CallTranscript[]
  >([]);
  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);

  const activeListing = listings.find((listing) =>
    ["discovered", "queued_for_prescreen", "prescreening"].includes(listing.status)
  );
  const bookedViewing = viewings[0] ?? null;
  const failedCounts = listings.reduce<Record<string, number>>((acc, listing) => {
    if (listing.status === "failed" && listing.failureReason) {
      acc[listing.failureReason] = (acc[listing.failureReason] ?? 0) + 1;
    }
    return acc;
  }, {});

  const openDrawerForListing = useCallback(
    (listing: ListingCard) => {
      setSelectedListing(listing);
      const listingTranscripts = transcripts.filter(
        (t) => t.listingId === listing.listingId
      );
      setSelectedTranscripts(listingTranscripts);
      const viewing =
        viewings.find((v) => v.listingId === listing.listingId) ?? null;
      setSelectedViewing(viewing);
      setDrawerOpen(true);
    },
    [transcripts, viewings]
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
      {loading && listings.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
          Loading live search pipeline...
        </div>
      ) : null}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border bg-off-white px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-mid">
            Agent Run
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
            <span>Compared {listings.length} live listings</span>
            <span>
              Rejected {Object.values(failedCounts).reduce((sum, count) => sum + count, 0)} as obvious mismatches
            </span>
            {activeListing ? (
              <span>Calling {activeListing.address}</span>
            ) : bookedViewing ? (
              <span>
                Booked {bookedViewing.address} for{" "}
                {new Date(bookedViewing.scheduledAt).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
          </div>
          {Object.keys(failedCounts).length > 0 && (
            <p className="mt-2 text-sm text-ink-muted">
              Reasons filtered out:{" "}
              {Object.entries(failedCounts)
                .map(([reason, count]) => `${reason.toLowerCase().replace(/_/g, " ")} (${count})`)
                .join(", ")}
            </p>
          )}
          {user && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-mid">
              <span className="rounded-full bg-white px-3 py-1 border border-border">
                Budget: up to ${user.maxBudget.toLocaleString()}
              </span>
              {user.preferences.locations.length > 0 && (
                <span className="rounded-full bg-white px-3 py-1 border border-border">
                  Areas: {user.preferences.locations.join(", ")}
                </span>
              )}
              <span className="rounded-full bg-white px-3 py-1 border border-border">
                Bedrooms: {user.minBedrooms === user.maxBedrooms ? user.minBedrooms : `${user.minBedrooms}-${user.maxBedrooms}`} BR
              </span>
              {user.hasPet && (
                <span className="rounded-full bg-white px-3 py-1 border border-border">
                  Pet: {user.petWeightLbs ? `${user.petWeightLbs} lb ` : ""}{user.petType ?? "pet"}
                </span>
              )}
              {user.preferences.tourAvailability && (
                <span className="rounded-full bg-white px-3 py-1 border border-border">
                  Tour windows: {user.preferences.tourAvailability}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
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
        </div>
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
