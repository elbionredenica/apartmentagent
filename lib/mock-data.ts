import type {
  User,
  ListingCard,
  CallTranscript,
  Viewing,
  Message,
  ChatResponse,
} from "@/types";

// Demo user matching seed.sql
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export const mockUser: User = {
  id: DEMO_USER_ID,
  email: "demo@apartmentagent.com",
  createdAt: "2025-01-15T10:00:00Z",
  maxBudget: 3000,
  minBedrooms: 2,
  maxBedrooms: 3,
  hasPet: true,
  petType: "dog",
  petWeightLbs: 60,
  dealbreakers: ["no_pets", "ground_floor_only"],
  preferences: {
    locations: ["SOMA", "Mission District"],
    minBathrooms: 1,
    mustHaves: ["in-unit laundry", "quiet"],
    niceToHaves: ["parking", "dishwasher"],
    moveInTimeline: "within_30_days",
    customQuestions: ["How often does rent increase?"],
    notes: "Works from home three days a week",
  },
  learnedPreferences: {},
};

// Listings matching seed.sql with various states
const LISTING_1_ID = "00000000-0000-0000-0000-000000000101";
const LISTING_2_ID = "00000000-0000-0000-0000-000000000102";
const LISTING_3_ID = "00000000-0000-0000-0000-000000000103";

export const mockListings: ListingCard[] = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    listingId: LISTING_1_ID,
    address: "123 Market St, Apt 4B",
    city: "San Francisco",
    rent: 2800,
    bedrooms: 2,
    bathrooms: 2,
    status: "booked",
    failureReason: null,
    lastUpdatedAt: "2025-01-15T14:30:00Z",
    overallScore: 87,
    propertyManager: "Bay Property Mgmt",
    phone: "+14155551234",
    description:
      "Beautiful 2BR apartment in SOMA. Pet-friendly building. Quiet neighborhood. Recently renovated kitchen.",
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    listingId: LISTING_2_ID,
    address: "456 Mission St, Unit 12",
    city: "San Francisco",
    rent: 2500,
    bedrooms: 2,
    bathrooms: 1,
    status: "failed",
    failureReason: "PETS",
    lastUpdatedAt: "2025-01-15T13:45:00Z",
    overallScore: null,
    propertyManager: "Mission Realty",
    phone: "+14155555678",
    description:
      "Cozy 2BR in downtown. No pets allowed. Great for professionals. Walking distance to BART.",
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    listingId: LISTING_3_ID,
    address: "789 Valencia St, #3",
    city: "San Francisco",
    rent: 3200,
    bedrooms: 3,
    bathrooms: 2,
    status: "deepscreening",
    failureReason: null,
    lastUpdatedAt: "2025-01-15T15:00:00Z",
    overallScore: null,
    propertyManager: "Valencia Homes",
    phone: "+14155559012",
    description:
      "Spacious 3BR in Mission District. Pet-friendly with dog park. Washer/dryer in unit. Parking included.",
  },
];

// Call transcripts
export const mockTranscripts: CallTranscript[] = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    userId: DEMO_USER_ID,
    listingId: LISTING_1_ID,
    callType: "prescreen",
    callId: "bland-call-001",
    phoneNumber: "+14155551234",
    durationSeconds: 180,
    transcript: `Agent: Hi, I'm calling about the 2-bedroom apartment at 123 Market St listed for $2,800 a month. Is it still available?

Landlord: Yes, it's still available! We just renovated the kitchen.

Agent: Great. I have a client with a 60-pound dog. Is the building pet-friendly?

Landlord: Absolutely, we love pets here. We have a small pet deposit of $500 but no breed or weight restrictions.

Agent: That's perfect. Is the unit quiet? My client works from home.

Landlord: Very quiet. It's on the 4th floor, away from street noise. The building has good soundproofing between units.

Agent: Wonderful. What's the lease term and when is the earliest move-in?

Landlord: Standard 12-month lease. The unit is available February 1st.

Agent: Thank you for the information. I'll pass this along to my client.`,
    extractedData: {
      petPolicy: "Allowed, $500 deposit, no restrictions",
      noiseLevel: "Quiet, 4th floor, good soundproofing",
      moveInDate: "February 1st",
      leaseTerm: "12 months",
    },
    outcome: "PASS",
    failureReason: null,
    complianceViolation: false,
    complianceNotes: null,
    calledAt: "2025-01-15T12:00:00Z",
    managementScore: null,
    noiseScore: null,
    valueScore: null,
    flexibilityScore: null,
    overallScore: null,
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    userId: DEMO_USER_ID,
    listingId: LISTING_1_ID,
    callType: "deepscreen",
    callId: "bland-call-002",
    phoneNumber: "+14155551234",
    durationSeconds: 420,
    transcript: `Agent: Hi again, I'm following up about the apartment at 123 Market St. My client is very interested. Could I ask a few more detailed questions?

Landlord: Of course, happy to help.

Agent: How responsive is management to maintenance requests?

Landlord: We have an online portal and typically address requests within 24-48 hours. Emergency issues are handled same-day.

Agent: That's reassuring. My client mentioned noise is important. Can you tell me more about the neighborhood noise levels?

Landlord: SOMA has some nightlife, but this block is residential. We haven't had noise complaints. Double-pane windows throughout.

Agent: Good to know. At $2,800, does the rent include any utilities?

Landlord: Water and trash are included. Electricity and internet are tenant responsibility. Typical electric bill is around $80-100.

Agent: Is there any flexibility on rent or lease terms?

Landlord: We can do a 14-month lease at $2,750. Otherwise it's $2,800 for 12 months.

Agent: My client wanted to know — how often does rent typically increase?

Landlord: We follow SF rent control guidelines, so increases are capped. Usually 2-3% annually.

Agent: Thank you. Can we schedule a viewing?

Landlord: Absolutely! How about this Thursday at 2 PM?

Agent: That works perfectly. I'll confirm with my client.`,
    extractedData: {
      maintenanceResponse: "24-48 hours, same-day emergency",
      noiseDetails: "Residential block, double-pane windows",
      utilities: "Water/trash included, electric ~$80-100",
      rentFlexibility: "$2,750 for 14-month lease option",
      rentIncreases: "SF rent control, 2-3% annually",
    },
    outcome: "PASS",
    failureReason: null,
    complianceViolation: false,
    complianceNotes: null,
    calledAt: "2025-01-15T14:00:00Z",
    managementScore: 90,
    noiseScore: 82,
    valueScore: 85,
    flexibilityScore: 78,
    overallScore: 87,
  },
];

// Viewings
function getNextThursday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(14, 0, 0, 0);
  return nextThursday.toISOString();
}

function getNextFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  nextFriday.setHours(10, 0, 0, 0);
  return nextFriday.toISOString();
}

export const mockViewings: Viewing[] = [
  {
    id: "00000000-0000-0000-0000-000000000401",
    userId: DEMO_USER_ID,
    listingId: LISTING_1_ID,
    scheduledAt: getNextThursday(),
    durationMinutes: 30,
    calendarEventId: null,
    status: "scheduled",
    attended: null,
    userRating: null,
    userFeedback: null,
    wouldApply: null,
    createdAt: "2025-01-15T14:30:00Z",
    updatedAt: "2025-01-15T14:30:00Z",
    address: "123 Market St, Apt 4B",
    rent: 2800,
    propertyManager: "Bay Property Mgmt",
  },
  {
    id: "00000000-0000-0000-0000-000000000402",
    userId: DEMO_USER_ID,
    listingId: LISTING_3_ID,
    scheduledAt: getNextFriday(),
    durationMinutes: 30,
    calendarEventId: null,
    status: "scheduled",
    attended: null,
    userRating: null,
    userFeedback: null,
    wouldApply: null,
    createdAt: "2025-01-15T15:00:00Z",
    updatedAt: "2025-01-15T15:00:00Z",
    address: "789 Valencia St, #3",
    rent: 3200,
    propertyManager: "Valencia Homes",
  },
];

// Scripted chat responses for mock mode
export const MOCK_CHAT_RESPONSES: ChatResponse[] = [
  {
    message:
      "Hey! I'm your apartment hunting agent. I'll find and call listings for you, ask your specific questions, and only book viewings worth your time. Let's start — what's the max you want to spend on rent each month?",
    profilePatch: {},
    missingFields: [
      "maxBudget",
      "locations",
      "bedrooms",
      "petDetails",
      "dealbreakers",
    ],
    readyToStart: false,
  },
  {
    message:
      "Got it, up to $3,000/month. Where in the city are you looking? Any specific neighborhoods?",
    profilePatch: { maxBudget: 3000 },
    missingFields: [
      "locations",
      "bedrooms",
      "petDetails",
      "dealbreakers",
    ],
    readyToStart: false,
  },
  {
    message:
      "SOMA and Mission — great choices. How many bedrooms do you need?",
    profilePatch: { locations: ["SOMA", "Mission District"] },
    missingFields: ["bedrooms", "petDetails", "dealbreakers"],
    readyToStart: false,
  },
  {
    message:
      "2 to 3 bedrooms, noted. Do you have any pets? If so, what kind and how much do they weigh?",
    profilePatch: { minBedrooms: 2, maxBedrooms: 3 },
    missingFields: ["petDetails", "dealbreakers"],
    readyToStart: false,
  },
  {
    message:
      "A 60-pound dog — I'll make sure to ask about pet policies and weight limits on every call. Last thing — are there any absolute dealbreakers? Things that would make you immediately pass on a place?",
    profilePatch: { hasPet: true, petType: "dog", petWeightLbs: 60 },
    missingFields: ["dealbreakers"],
    readyToStart: false,
  },
  {
    message:
      "Got everything I need. No-pet buildings and ground-floor-only units are off the table. I'm starting calls on 8 listings now — I'll book the ones worth your time.",
    profilePatch: { dealbreakers: ["no_pets", "ground_floor_only"] },
    missingFields: [],
    readyToStart: true,
    action: "START_SEARCH",
    preferences: {
      maxBudget: 3000,
      minBedrooms: 2,
      maxBedrooms: 3,
      hasPet: true,
      petType: "dog",
      petWeightLbs: 60,
      dealbreakers: ["no_pets", "ground_floor_only"],
      locations: ["SOMA", "Mission District"],
    },
  },
];
