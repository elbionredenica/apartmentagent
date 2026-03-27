export type ListingStatus =
  | "discovered"
  | "criteria_checked"
  | "queued_for_prescreen"
  | "prescreening"
  | "prescreened"
  | "queued_for_deepscreen"
  | "deepscreening"
  | "deepscreened"
  | "ready_for_booking"
  | "voicemail_pending"
  | "booked"
  | "failed";

export type UIListingStatus =
  | "Evaluating"
  | "Queued"
  | "Reaching Out"
  | "Deep Screening"
  | "Ready to Book"
  | "Unable to Reach"
  | "Booked"
  | "Not a Fit";

export type FailureReason =
  | "PRICE"
  | "BEDROOMS"
  | "PETS"
  | "UNAVAILABLE"
  | "LOW_SCORE"
  | "COMPLIANCE_VIOLATION"
  | "MAX_RETRIES"
  | "WRONG_NUMBER";

export interface Listing {
  id: string;
  externalId: string;
  source: string;
  address: string;
  city: string;
  state: string;
  zipCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rent: number;
  deposit: number | null;
  squareFeet: number | null;
  phone: string | null;
  email: string | null;
  propertyManager: string | null;
  description: string | null;
  amenities: string[];
  photos: string[];
  firstSeenAt: string;
  lastUpdatedAt: string;
  isAvailable: boolean;
}

export interface ListingCard {
  id: string;
  listingId: string;
  address: string;
  city: string;
  rent: number;
  bedrooms: number | null;
  bathrooms: number | null;
  status: ListingStatus;
  failureReason: FailureReason | null;
  lastUpdatedAt: string;
  overallScore: number | null;
  propertyManager: string | null;
  phone: string | null;
  description: string | null;
}
