import { NextResponse } from "next/server";
import { resolveBackendUserForViewer } from "@/lib/backend-user";
import { getViewer } from "@/lib/session";

function mapUser(user: Record<string, unknown>) {
  const preferences =
    user.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  return {
    id: String(user.id),
    email: String(user.email ?? ""),
    createdAt: String(user.created_at ?? ""),
    maxBudget: Number(user.max_budget ?? 0),
    minBedrooms: Number(user.min_bedrooms ?? 0),
    maxBedrooms: Number(user.max_bedrooms ?? 0),
    hasPet: Boolean(user.has_pet),
    petType: user.pet_type == null ? null : String(user.pet_type),
    petWeightLbs:
      user.pet_weight_lbs == null ? null : Number(user.pet_weight_lbs),
    dealbreakers: Array.isArray(user.dealbreakers)
      ? user.dealbreakers.map(String)
      : [],
    preferences: {
      locations: Array.isArray(preferences.locations)
        ? preferences.locations.map(String)
        : [],
      niceToHaves: Array.isArray(preferences.niceToHaves)
        ? preferences.niceToHaves.map(String)
        : [],
      mustHaves: Array.isArray(preferences.mustHaves)
        ? preferences.mustHaves.map(String)
        : [],
      moveInTimeline:
        preferences.moveInTimeline == null
          ? undefined
          : String(preferences.moveInTimeline),
      tourAvailability:
        preferences.tourAvailability == null
          ? undefined
          : String(preferences.tourAvailability),
      customQuestions: Array.isArray(preferences.customQuestions)
        ? preferences.customQuestions.map(String)
        : [],
    },
    learnedPreferences:
      user.learned_preferences && typeof user.learned_preferences === "object"
        ? user.learned_preferences
        : {},
  };
}

function mapListing(listing: Record<string, unknown>) {
  return {
    id: String(listing.id),
    listingId: String(listing.id),
    address: String(listing.address ?? ""),
    city: String(listing.city ?? ""),
    rent: Number(listing.rent ?? 0),
    bedrooms:
      listing.bedrooms == null ? null : Number(listing.bedrooms),
    bathrooms:
      listing.bathrooms == null ? null : Number(listing.bathrooms),
    status: String(listing.status ?? "discovered"),
    failureReason:
      listing.failure_reason == null ? null : String(listing.failure_reason),
    lastUpdatedAt: new Date().toISOString(),
    overallScore: null,
    propertyManager:
      listing.property_manager == null ? null : String(listing.property_manager),
    phone: listing.phone == null ? null : String(listing.phone),
    description:
      listing.description == null ? null : String(listing.description),
    callCount: Number(listing.call_count ?? 0),
  };
}

function mapTranscript(transcript: Record<string, unknown>) {
  return {
    id: String(transcript.id),
    userId: String(transcript.user_id),
    listingId: String(transcript.listing_id),
    callType: String(transcript.call_type),
    callId: transcript.call_id == null ? null : String(transcript.call_id),
    phoneNumber:
      transcript.phone_number == null ? null : String(transcript.phone_number),
    durationSeconds:
      transcript.duration_seconds == null
        ? null
        : Number(transcript.duration_seconds),
    transcript: String(transcript.transcript ?? ""),
    extractedData:
      transcript.extracted_data && typeof transcript.extracted_data === "object"
        ? transcript.extracted_data
        : null,
    outcome: String(transcript.outcome ?? "PASS"),
    failureReason:
      transcript.failure_reason == null ? null : String(transcript.failure_reason),
    complianceViolation: Boolean(transcript.compliance_violation),
    complianceNotes:
      transcript.compliance_notes == null
        ? null
        : String(transcript.compliance_notes),
    calledAt: String(transcript.called_at),
    managementScore:
      transcript.management_score == null
        ? null
        : Number(transcript.management_score),
    noiseScore:
      transcript.noise_score == null ? null : Number(transcript.noise_score),
    valueScore:
      transcript.value_score == null ? null : Number(transcript.value_score),
    flexibilityScore:
      transcript.flexibility_score == null
        ? null
        : Number(transcript.flexibility_score),
    overallScore:
      transcript.overall_score == null ? null : Number(transcript.overall_score),
  };
}

function mapViewing(viewing: Record<string, unknown>) {
  return {
    id: String(viewing.id),
    userId: String(viewing.user_id),
    listingId: String(viewing.listing_id),
    scheduledAt: String(viewing.scheduled_at),
    durationMinutes: Number(viewing.duration_minutes ?? 30),
    calendarEventId:
      viewing.calendar_event_id == null
        ? null
        : String(viewing.calendar_event_id),
    status: String(viewing.status ?? "scheduled"),
    attended:
      viewing.attended == null ? null : Boolean(viewing.attended),
    userRating:
      viewing.user_rating == null ? null : Number(viewing.user_rating),
    userFeedback:
      viewing.user_feedback == null ? null : String(viewing.user_feedback),
    wouldApply:
      viewing.would_apply == null ? null : Boolean(viewing.would_apply),
    createdAt: String(viewing.created_at),
    updatedAt: String(viewing.updated_at),
    address: viewing.address == null ? undefined : String(viewing.address),
    rent: viewing.rent == null ? undefined : Number(viewing.rent),
    propertyManager:
      viewing.property_manager == null
        ? undefined
        : String(viewing.property_manager),
  };
}

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUser = await resolveBackendUserForViewer(viewer);
  if (!backendUser) {
    return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const response = await fetch(
    `${apiBaseUrl}/api/demo/dashboard?user_id=${encodeURIComponent(backendUser.id)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: "Failed to load dashboard", details: errorText },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json({
    user: mapUser(data.user),
    listings: (data.listings ?? []).map(mapListing),
    transcripts: (data.transcripts ?? []).map(mapTranscript),
    viewings: (data.viewings ?? []).map(mapViewing),
  });
}
