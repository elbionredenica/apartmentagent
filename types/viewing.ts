export type ViewingStatus = "scheduled" | "completed" | "cancelled";

export interface Viewing {
  id: string;
  userId: string;
  listingId: string;
  scheduledAt: string;
  durationMinutes: number;
  calendarEventId: string | null;
  status: ViewingStatus;
  attended: boolean | null;
  userRating: number | null;
  userFeedback: string | null;
  wouldApply: boolean | null;
  createdAt: string;
  updatedAt: string;
  // Joined from listings for calendar display
  address?: string;
  rent?: number;
  propertyManager?: string | null;
}
