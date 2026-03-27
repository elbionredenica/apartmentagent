import { NextRequest, NextResponse } from "next/server";
import type { ChatResponse, DraftProfile, Message } from "@/types";

type MissingField =
  | "maxBudget"
  | "locations"
  | "bedrooms"
  | "petDetails"
  | "dealbreakers"
  | "mustHaves"
  | "moveInTimeline"
  | "tourAvailability"
  | "customQuestions";

const KNOWN_LOCATIONS = [
  "soma",
  "mission district",
  "mission",
  "downtown",
  "financial district",
  "nob hill",
  "russian hill",
  "north beach",
  "pac heights",
  "pacific heights",
  "sunset",
  "richmond",
  "austin",
  "west campus",
];

function getLatestUserMessage(messages: Message[]): string {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

function parseBudget(input: string): number | undefined {
  const normalized = input.replace(/,/g, "");
  const dollarMatch = normalized.match(/\$?\s*(\d{3,5})/);
  if (!dollarMatch) return undefined;
  const value = Number(dollarMatch[1]);
  return Number.isFinite(value) ? value : undefined;
}

function parseBedrooms(input: string): Pick<DraftProfile, "minBedrooms" | "maxBedrooms"> | undefined {
  const normalized = input.toLowerCase();
  const rangeMatch = normalized.match(/(\d)\s*(?:-|to)\s*(\d)/);
  if (rangeMatch) {
    return {
      minBedrooms: Number(rangeMatch[1]),
      maxBedrooms: Number(rangeMatch[2]),
    };
  }

  const singleMatch = normalized.match(/(\d)\s*(?:br|bed|bedroom)?/);
  if (singleMatch) {
    const bedrooms = Number(singleMatch[1]);
    return {
      minBedrooms: bedrooms,
      maxBedrooms: bedrooms,
    };
  }

  if (normalized.includes("studio")) {
    return {
      minBedrooms: 0,
      maxBedrooms: 0,
    };
  }

  return undefined;
}

function parseLocations(input: string): string[] {
  const normalized = input.toLowerCase();
  const found = KNOWN_LOCATIONS.filter((location) => normalized.includes(location));
  if (found.length > 0) {
    return [...new Set(found.map((location) => (location === "mission" ? "Mission District" : titleCase(location))))];
  }

  const chunks = input
    .split(/,|\/| and /i)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part.length > 2);

  return chunks.slice(0, 3);
}

function parsePetDetails(input: string): Pick<DraftProfile, "hasPet" | "petType" | "petWeightLbs"> | undefined {
  const normalized = input.toLowerCase();
  if (/\b(no pets?|none|nope)\b/.test(normalized)) {
    return { hasPet: false, petType: undefined, petWeightLbs: undefined };
  }

  const hasPetSignal = /\b(dog|cat|pet|pets)\b/.test(normalized);
  if (!hasPetSignal) {
    return undefined;
  }

  const petType = normalized.includes("cat")
    ? "cat"
    : normalized.includes("dog")
    ? "dog"
    : "pet";

  const weightMatch = normalized.match(/(\d{1,3})\s*(?:lb|lbs|pounds?)/);

  return {
    hasPet: true,
    petType,
    petWeightLbs: weightMatch ? Number(weightMatch[1]) : undefined,
  };
}

function parseDealbreakers(input: string): string[] {
  const normalized = input.toLowerCase();
  if (/\b(no|none|nothing)\b/.test(normalized)) {
    return [];
  }

  const mapped = new Set<string>();
  if (normalized.includes("no pets")) mapped.add("no_pets");
  if (normalized.includes("ground floor")) mapped.add("ground_floor_only");
  if (normalized.includes("loud") || normalized.includes("noise")) mapped.add("too_noisy");
  if (normalized.includes("parking")) mapped.add("no_parking");

  const chunks = input
    .split(/,| and /i)
    .map((part) => part.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);

  for (const chunk of chunks) {
    if (!mapped.has(chunk)) {
      mapped.add(chunk);
    }
  }

  return [...mapped];
}

function parseMustHaves(input: string): string[] {
  const normalized = input.toLowerCase();
  if (/\b(no|none|nothing)\b/.test(normalized)) {
    return [];
  }

  const mapped = new Set<string>();
  for (const keyword of ["quiet", "parking", "laundry", "dishwasher", "balcony", "natural light"]) {
    if (normalized.includes(keyword)) {
      mapped.add(keyword);
    }
  }

  const chunks = input
    .split(/,| and /i)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    if (![...mapped].some((value) => chunk.toLowerCase().includes(value))) {
      mapped.add(chunk);
    }
  }

  return [...mapped];
}

function parseMoveInTimeline(input: string): string | undefined {
  const normalized = input.toLowerCase();
  if (normalized.includes("asap")) return "asap";
  if (normalized.includes("30")) return "within_30_days";
  if (normalized.includes("60")) return "within_60_days";
  if (normalized.includes("this week")) return "this_week";
  if (normalized.includes("this month")) return "this_month";
  if (normalized.includes("next month")) return "next_month";
  return input.trim() ? input.trim() : undefined;
}

function parseTourAvailability(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}

function parseCustomQuestions(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed || /\b(no|none|nope)\b/i.test(trimmed)) {
    return [];
  }

  if (trimmed.includes("?")) {
    return trimmed
      .split("?")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => `${part}?`);
  }

  return [trimmed];
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function mergeProfile(current: Partial<DraftProfile>, patch: Partial<DraftProfile>): Partial<DraftProfile> {
  return {
    ...current,
    ...patch,
  };
}

function getMissingFields(profile: Partial<DraftProfile>): MissingField[] {
  const missing: MissingField[] = [];

  if (!profile.maxBudget) missing.push("maxBudget");
  if (!profile.locations || profile.locations.length === 0) missing.push("locations");
  if (profile.minBedrooms == null || profile.maxBedrooms == null) missing.push("bedrooms");
  if (profile.hasPet == null || (profile.hasPet && (!profile.petType || !profile.petWeightLbs))) {
    missing.push("petDetails");
  }
  if (!profile.dealbreakers) missing.push("dealbreakers");
  if (!profile.mustHaves) missing.push("mustHaves");
  if (!profile.moveInTimeline) missing.push("moveInTimeline");
  if (!profile.tourAvailability) missing.push("tourAvailability");
  if (!profile.customQuestions) missing.push("customQuestions");

  return missing;
}

function nextQuestion(field: MissingField): string {
  switch (field) {
    case "maxBudget":
      return "What’s the max you want to spend on rent each month?";
    case "locations":
      return "Which city or neighborhoods should I focus on?";
    case "bedrooms":
      return "How many bedrooms do you need?";
    case "petDetails":
      return "Do you have any pets? If yes, what kind and about how much do they weigh?";
    case "dealbreakers":
      return "Any absolute dealbreakers? Things that should make me reject a place immediately?";
    case "mustHaves":
      return "What are your must-haves? For example: quiet, parking, in-unit laundry, natural light.";
    case "moveInTimeline":
      return "What’s your move-in timeline?";
    case "customQuestions":
      return `Any custom question you want me to ask when I call, or should I just use the default ones?`;
    case "tourAvailability":
      return "If a place checks out, when are you generally free for tours? Give me a couple of windows like Tuesday after 6pm or Friday morning.";
    default:
      return "Tell me a bit more.";
  }
}

function buildReadyMessage(profile: Partial<DraftProfile>): string {
  const locationText =
    profile.locations && profile.locations.length > 0
      ? ` in ${profile.locations.join(", ")}`
      : "";

  return `Perfect. I have enough to start. I’m going to scan the live listings${locationText}, eliminate anything that fails your criteria, call the best match, and if it checks out I’ll ask for a tour time that fits your availability and put it on your calendar.`;
}

function applyFieldExtraction(
  field: MissingField,
  latestMessage: string,
  profile: Partial<DraftProfile>
): Partial<DraftProfile> {
  switch (field) {
    case "maxBudget": {
      const maxBudget = parseBudget(latestMessage);
      return maxBudget ? { maxBudget } : {};
    }
    case "locations": {
      const locations = parseLocations(latestMessage);
      return locations.length > 0 ? { locations } : {};
    }
    case "bedrooms":
      return parseBedrooms(latestMessage) ?? {};
    case "petDetails":
      return parsePetDetails(latestMessage) ?? {};
    case "dealbreakers":
      return { dealbreakers: parseDealbreakers(latestMessage) };
    case "mustHaves":
      return { mustHaves: parseMustHaves(latestMessage) };
    case "moveInTimeline": {
      const moveInTimeline = parseMoveInTimeline(latestMessage);
      return moveInTimeline ? { moveInTimeline } : {};
    }
    case "tourAvailability": {
      const tourAvailability = parseTourAvailability(latestMessage);
      return tourAvailability ? { tourAvailability } : {};
    }
    case "customQuestions":
      return { customQuestions: parseCustomQuestions(latestMessage) };
    default:
      return profile;
  }
}

export async function POST(request: NextRequest) {
  const { messages, draftProfile } = (await request.json()) as {
    messages: Message[];
    draftProfile: Partial<DraftProfile>;
  };

  if (!messages || messages.length === 0) {
    const response: ChatResponse = {
      message:
        "Hey! I'm Scout, your apartment hunting agent. I’ll compare live listings, call the best match, and only book a tour if it actually checks out. Let’s start with budget — what’s the max you want to spend each month?",
      profilePatch: {},
      missingFields: getMissingFields({}),
      readyToStart: false,
    };
    return NextResponse.json(response);
  }

  const latestUserMessage = getLatestUserMessage(messages);
  const currentProfile = draftProfile ?? {};
  const currentMissingFields = getMissingFields(currentProfile);
  const fieldToFill = currentMissingFields[0];
  const profilePatch = fieldToFill
    ? applyFieldExtraction(fieldToFill, latestUserMessage, currentProfile)
    : {};
  const mergedProfile = mergeProfile(currentProfile, profilePatch);
  const remainingMissingFields = getMissingFields(mergedProfile);

  const response: ChatResponse = {
    message:
      remainingMissingFields.length === 0
        ? buildReadyMessage(mergedProfile)
        : nextQuestion(remainingMissingFields[0]),
    profilePatch,
    missingFields: remainingMissingFields,
    readyToStart: remainingMissingFields.length === 0,
    action: remainingMissingFields.length === 0 ? "START_SEARCH" : undefined,
    preferences:
      remainingMissingFields.length === 0
        ? (mergedProfile as DraftProfile)
        : undefined,
  };

  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json(response);
}
