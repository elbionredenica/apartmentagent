import type { ListingCard } from "./listing";
import type { Viewing } from "./viewing";

export type SSEEvent =
  | { type: "listing_update"; data: ListingCard }
  | { type: "new_viewing"; data: Viewing }
  | { type: "transcript_ready"; data: { listingId: string; transcriptId: string } }
  | { type: "connected"; data: null };
