import type { ListingStatus, UIListingStatus } from "@/types";

interface StatusMapping {
  label: UIListingStatus;
  bgClass: string;
  textClass: string;
}

const STATUS_MAP: Record<ListingStatus, StatusMapping> = {
  discovered: {
    label: "Evaluating",
    bgClass: "bg-badge-muted-bg",
    textClass: "text-ink-muted",
  },
  criteria_checked: {
    label: "Evaluating",
    bgClass: "bg-badge-muted-bg",
    textClass: "text-ink-muted",
  },
  queued_for_prescreen: {
    label: "Queued",
    bgClass: "bg-badge-muted-bg",
    textClass: "text-ink-mid",
  },
  prescreening: {
    label: "Reaching Out",
    bgClass: "bg-accent-light",
    textClass: "text-accent",
  },
  deepscreening: {
    label: "Reaching Out",
    bgClass: "bg-accent-light",
    textClass: "text-accent",
  },
  prescreened: {
    label: "Deep Screening",
    bgClass: "bg-accent-light",
    textClass: "text-accent",
  },
  queued_for_deepscreen: {
    label: "Deep Screening",
    bgClass: "bg-accent-light",
    textClass: "text-accent",
  },
  deepscreened: {
    label: "Deep Screening",
    bgClass: "bg-accent-light",
    textClass: "text-accent",
  },
  ready_for_booking: {
    label: "Ready to Book",
    bgClass: "bg-badge-shortlisted-bg",
    textClass: "text-badge-shortlisted-text",
  },
  voicemail_pending: {
    label: "Unable to Reach",
    bgClass: "bg-badge-muted-bg",
    textClass: "text-ink-muted",
  },
  booked: {
    label: "Booked",
    bgClass: "bg-badge-booked-bg",
    textClass: "text-success",
  },
  failed: {
    label: "Not a Fit",
    bgClass: "bg-badge-muted-bg",
    textClass: "text-ink-muted",
  },
};

export function mapBackendStatus(status: ListingStatus): StatusMapping {
  return STATUS_MAP[status];
}

export { STATUS_MAP };
