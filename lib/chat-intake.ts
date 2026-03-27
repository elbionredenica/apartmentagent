import type {
  ChatRequest,
  ChatResponse,
  DraftProfile,
  Message,
} from "../types/index.ts";

type MissingField =
  | "state"
  | "cities"
  | "budget"
  | "bedrooms"
  | "petDetails"
  | "dealbreakers"
  | "confirmation";

type PendingEdit = "location" | "budget" | "requirements" | null;
type CollectionStage =
  | "state"
  | "cities"
  | "bedrooms"
  | "budget"
  | "pets"
  | "petDetails"
  | "requirements"
  | "dealbreakers"
  | "review";

const INITIAL_PROMPT =
  "I'll get your calling brief ready before I reach out to listings. Which state are you searching in?";
const OPEN_ENDED_PROMPT =
  "What else do you need in the home you're searching for? Include must-haves, dealbreakers, and anything you want me to ask on the call.";
const DEALBREAKER_PROMPT =
  "What would make you immediately pass on a place?";

const US_STATES: Record<string, string> = {
  al: "Alabama",
  alabama: "Alabama",
  ak: "Alaska",
  alaska: "Alaska",
  az: "Arizona",
  arizona: "Arizona",
  ar: "Arkansas",
  arkansas: "Arkansas",
  ca: "California",
  california: "California",
  co: "Colorado",
  colorado: "Colorado",
  ct: "Connecticut",
  connecticut: "Connecticut",
  de: "Delaware",
  delaware: "Delaware",
  dc: "District of Columbia",
  "district of columbia": "District of Columbia",
  fl: "Florida",
  florida: "Florida",
  ga: "Georgia",
  georgia: "Georgia",
  hi: "Hawaii",
  hawaii: "Hawaii",
  id: "Idaho",
  idaho: "Idaho",
  il: "Illinois",
  illinois: "Illinois",
  in: "Indiana",
  indiana: "Indiana",
  ia: "Iowa",
  iowa: "Iowa",
  ks: "Kansas",
  kansas: "Kansas",
  ky: "Kentucky",
  kentucky: "Kentucky",
  la: "Louisiana",
  louisiana: "Louisiana",
  me: "Maine",
  maine: "Maine",
  md: "Maryland",
  maryland: "Maryland",
  ma: "Massachusetts",
  massachusetts: "Massachusetts",
  mi: "Michigan",
  michigan: "Michigan",
  mn: "Minnesota",
  minnesota: "Minnesota",
  ms: "Mississippi",
  mississippi: "Mississippi",
  mo: "Missouri",
  missouri: "Missouri",
  mt: "Montana",
  montana: "Montana",
  ne: "Nebraska",
  nebraska: "Nebraska",
  nv: "Nevada",
  nevada: "Nevada",
  nh: "New Hampshire",
  "new hampshire": "New Hampshire",
  nj: "New Jersey",
  "new jersey": "New Jersey",
  nm: "New Mexico",
  "new mexico": "New Mexico",
  ny: "New York",
  "new york": "New York",
  nc: "North Carolina",
  "north carolina": "North Carolina",
  nd: "North Dakota",
  "north dakota": "North Dakota",
  oh: "Ohio",
  ohio: "Ohio",
  ok: "Oklahoma",
  oklahoma: "Oklahoma",
  or: "Oregon",
  oregon: "Oregon",
  pa: "Pennsylvania",
  pennsylvania: "Pennsylvania",
  ri: "Rhode Island",
  "rhode island": "Rhode Island",
  sc: "South Carolina",
  "south carolina": "South Carolina",
  sd: "South Dakota",
  "south dakota": "South Dakota",
  tn: "Tennessee",
  tennessee: "Tennessee",
  tx: "Texas",
  texas: "Texas",
  ut: "Utah",
  utah: "Utah",
  vt: "Vermont",
  vermont: "Vermont",
  va: "Virginia",
  virginia: "Virginia",
  wa: "Washington",
  washington: "Washington",
  wv: "West Virginia",
  "west virginia": "West Virginia",
  wi: "Wisconsin",
  wisconsin: "Wisconsin",
  wy: "Wyoming",
  wyoming: "Wyoming",
};

const NEGATIVE_HINTS = [
  "no ",
  "not ",
  "without ",
  "avoid ",
  "can't ",
  "cannot ",
  "won't ",
  "dealbreaker",
  "pass on",
  "ground floor",
  "street parking",
  "stairs",
  "smoking",
  "shared laundry",
];
const NICE_TO_HAVE_HINTS = ["nice to have", "bonus", "would love", "ideally"];
const QUESTION_HINTS = ["ask", "question", "?"];
const CONFIRM_HINTS = [
  "looks right, start calling",
  "looks right start calling",
  "start calling",
  "start the calls",
  "go ahead and call",
  "looks good, start calling",
  "looks good start calling",
];

export function getChatResponse(request: ChatRequest): ChatResponse {
  const currentProfile = normalizeDraftProfile(request.draftProfile);
  const latestUserMessage = getLatestUserMessage(request.messages);

  if (!latestUserMessage) {
    return buildCollectingResponse(
      INITIAL_PROMPT,
      currentProfile,
      getMissingFields(currentProfile)
    );
  }

  const previousAgentMessage = getPreviousAgentMessage(request.messages);
  const pendingEdit = getPendingEdit(previousAgentMessage?.content ?? "");
  const inReview = isReadyForReview(currentProfile);

  if (pendingEdit) {
    const patch = extractPatch(latestUserMessage.content, {
      allowLocation: pendingEdit === "location",
      allowBudget: pendingEdit === "budget",
      allowRequirements: pendingEdit === "requirements",
      allowPetDetails: false,
    });
    const nextProfile = mergeDraftProfile(currentProfile, patch);
    return buildNextResponse(nextProfile);
  }

  if (inReview) {
    return handleReviewResponse(currentProfile, latestUserMessage.content);
  }

  const collectionStage = getCollectionStage(currentProfile);
  const nextProfile = mergeDraftProfile(
    currentProfile,
    extractPatch(
      latestUserMessage.content,
      getExtractionOptions(collectionStage, previousAgentMessage?.content ?? "")
    )
  );

  return buildNextResponse(nextProfile);
}

export function mergeDraftProfile(
  current: Partial<DraftProfile>,
  patch: Partial<DraftProfile>
): Partial<DraftProfile> {
  const merged: Partial<DraftProfile> = {
    ...current,
    ...patch,
  };

  if (patch.cities) {
    merged.cities = uniqueStrings(patch.cities);
  } else if (current.cities) {
    merged.cities = uniqueStrings(current.cities);
  }

  if (patch.locations) {
    merged.locations = uniqueStrings(patch.locations);
  } else if (merged.cities) {
    merged.locations = [...merged.cities];
  } else if (current.locations) {
    merged.locations = uniqueStrings(current.locations);
  }

  if (patch.mustHaves) {
    merged.mustHaves = uniqueStrings([...(current.mustHaves ?? []), ...patch.mustHaves]);
  } else if (current.mustHaves) {
    merged.mustHaves = uniqueStrings(current.mustHaves);
  }

  if (patch.niceToHaves) {
    merged.niceToHaves = uniqueStrings([
      ...(current.niceToHaves ?? []),
      ...patch.niceToHaves,
    ]);
  } else if (current.niceToHaves) {
    merged.niceToHaves = uniqueStrings(current.niceToHaves);
  }

  if (patch.customQuestions) {
    merged.customQuestions = uniqueStrings([
      ...(current.customQuestions ?? []),
      ...patch.customQuestions,
    ]);
  } else if (current.customQuestions) {
    merged.customQuestions = uniqueStrings(current.customQuestions);
  }

  if (patch.dealbreakers) {
    merged.dealbreakers = uniqueStrings([
      ...(current.dealbreakers ?? []),
      ...patch.dealbreakers,
    ]);
  } else if (current.dealbreakers) {
    merged.dealbreakers = uniqueStrings(current.dealbreakers);
  }

  if (patch.hasPet === false) {
    merged.petType = undefined;
    merged.petWeightLbs = undefined;
  }

  return normalizeDraftProfile(merged);
}

function handleReviewResponse(
  profile: Partial<DraftProfile>,
  userMessage: string
): ChatResponse {
  if (isExplicitConfirm(userMessage)) {
    return {
      phase: "confirmed",
      message:
        "Looks right. I'm locking this in and starting the calling flow now.",
      profilePatch: {},
      missingFields: [],
      quickReplies: [],
      readyToStart: true,
      action: "START_SEARCH",
      preferences: normalizeDraftProfile(profile),
    };
  }

  if (isBareLocationChangeRequest(userMessage)) {
    return buildCollectingResponse(
      "What should I change your location to? Give me the state and city or cities.",
      profile,
      ["state", "cities"],
      []
    );
  }

  if (isBareBudgetChangeRequest(userMessage)) {
    return buildCollectingResponse(
      "What should I change your budget to?",
      profile,
      ["budget"],
      ["Up to $2,500", "Up to $3,000", "Up to $4,000"]
    );
  }

  if (isBareRequirementsChangeRequest(userMessage)) {
    return buildCollectingResponse(
      "Tell me the extra must-have, dealbreaker, or call question I should add.",
      profile,
      ["dealbreakers"],
      []
    );
  }

  const directPatch = extractPatch(userMessage, {
    allowLocation: true,
    allowBudget: true,
    allowBedrooms: true,
    allowPets: true,
    allowPetDetails: true,
    allowRequirements: looksLikeRequirementText(userMessage),
  });
  const directProfile = mergeDraftProfile(profile, directPatch);
  if (!profilesEqual(profile, directProfile)) {
    return buildReviewResponse(directProfile);
  }

  return buildReviewResponse(
    profile,
    'I\'m ready to adjust it. Tell me what to change, or say "Looks right, start calling" when you want me to begin.'
  );
}

function buildNextResponse(profile: Partial<DraftProfile>): ChatResponse {
  const normalized = normalizeDraftProfile(profile);
  const missingFields = getMissingFields(normalized);

  if (!normalized.state) {
    return buildCollectingResponse(
      "Which state are you searching in?",
      normalized,
      missingFields
    );
  }

  if (!normalized.cities?.length) {
    return buildCollectingResponse(
      "Which city or cities should I focus on?",
      normalized,
      missingFields
    );
  }

  if (!hasBedrooms(normalized)) {
    return buildCollectingResponse(
      "How many bedrooms do you need?",
      normalized,
      missingFields,
      ["1 bedroom", "2 bedrooms", "3 bedrooms", "2-3 bedrooms"]
    );
  }

  if (normalized.maxBudget == null) {
    return buildCollectingResponse(
      "What's your max monthly budget?",
      normalized,
      missingFields,
      ["Up to $2,500", "Up to $3,000", "Up to $4,000"]
    );
  }

  if (normalized.hasPet == null) {
    return buildCollectingResponse(
      "Do you have any pets I should screen for?",
      normalized,
      missingFields,
      ["No pets", "Yes, dog", "Yes, cat"]
    );
  }

  if (normalized.hasPet && !hasPetDetails(normalized)) {
    return buildCollectingResponse(
      "What kind of pet is it, and how much does it weigh?",
      normalized,
      missingFields,
      ["Dog, 25 lbs", "Dog, 50 lbs", "Cat, 12 lbs"]
    );
  }

  if (!normalized.notes?.trim()) {
    return buildCollectingResponse(
      OPEN_ENDED_PROMPT,
      normalized,
      missingFields
    );
  }

  if (!normalized.dealbreakers?.length) {
    return buildCollectingResponse(
      DEALBREAKER_PROMPT,
      normalized,
      ["dealbreakers"],
      ["No smoking", "Street parking only", "Ground floor only"]
    );
  }

  return buildReviewResponse(normalized);
}

function buildCollectingResponse(
  message: string,
  profile: Partial<DraftProfile>,
  missingFields: MissingField[],
  quickReplies: string[] = []
): ChatResponse {
  return {
    phase: "collecting",
    message,
    profilePatch: profile,
    missingFields,
    quickReplies,
    readyToStart: false,
  };
}

function buildReviewResponse(
  profile: Partial<DraftProfile>,
  intro = "Here's what I'll screen for before I start calling."
): ChatResponse {
  return {
    phase: "review",
    message: `${intro}\n\n${buildReviewSummary(profile)}\n\nWhat should I change or add? Say "Looks right, start calling" when you want me to begin.`,
    profilePatch: profile,
    missingFields: ["confirmation"],
    quickReplies: [
      "Looks right, start calling",
      "Change location",
      "Change budget",
      "Add another requirement",
    ],
    readyToStart: false,
  };
}

function buildReviewSummary(profile: Partial<DraftProfile>): string {
  const lines = [
    `- State: ${profile.state ?? "Not set"}`,
    `- Cities: ${(profile.cities ?? []).join(", ") || "Not set"}`,
    `- Bedrooms: ${formatBedrooms(profile)}`,
    `- Budget: ${formatBudget(profile.maxBudget)}`,
    `- Pets: ${formatPets(profile)}`,
  ];

  if (profile.mustHaves?.length) {
    lines.push(`- Must-haves: ${profile.mustHaves.map(toDisplayText).join(", ")}`);
  }

  if (profile.niceToHaves?.length) {
    lines.push(
      `- Nice-to-haves: ${profile.niceToHaves.map(toDisplayText).join(", ")}`
    );
  }

  if (profile.dealbreakers?.length) {
    lines.push(
      `- Dealbreakers: ${profile.dealbreakers.map(toDisplayText).join(", ")}`
    );
  }

  if (profile.customQuestions?.length) {
    lines.push(
      `- Questions to ask: ${profile.customQuestions.map(toDisplayText).join("; ")}`
    );
  }

  if (profile.notes?.trim()) {
    lines.push(`- Notes: ${profile.notes.trim()}`);
  }

  return lines.join("\n");
}

function getMissingFields(profile: Partial<DraftProfile>): MissingField[] {
  const missing: MissingField[] = [];

  if (!profile.state) {
    missing.push("state");
  }

  if (!profile.cities?.length) {
    missing.push("cities");
  }

  if (!hasBedrooms(profile)) {
    missing.push("bedrooms");
  }

  if (profile.maxBudget == null) {
    missing.push("budget");
  }

  if (profile.hasPet == null || (profile.hasPet && !hasPetDetails(profile))) {
    missing.push("petDetails");
  }

  if (!profile.dealbreakers?.length) {
    missing.push("dealbreakers");
  }

  return missing;
}

function normalizeDraftProfile(profile: Partial<DraftProfile>): Partial<DraftProfile> {
  const nextProfile: Partial<DraftProfile> = { ...profile };

  if (nextProfile.state) {
    nextProfile.state = normalizeState(nextProfile.state);
  }

  if (nextProfile.cities) {
    nextProfile.cities = uniqueStrings(nextProfile.cities.map(normalizeCity));
    nextProfile.locations = [...nextProfile.cities];
  }

  if (nextProfile.dealbreakers) {
    nextProfile.dealbreakers = uniqueStrings(nextProfile.dealbreakers);
  }

  if (nextProfile.mustHaves) {
    nextProfile.mustHaves = uniqueStrings(nextProfile.mustHaves);
  }

  if (nextProfile.niceToHaves) {
    nextProfile.niceToHaves = uniqueStrings(nextProfile.niceToHaves);
  }

  if (nextProfile.customQuestions) {
    nextProfile.customQuestions = uniqueStrings(nextProfile.customQuestions);
  }

  if (nextProfile.hasPet === false) {
    nextProfile.petType = undefined;
    nextProfile.petWeightLbs = undefined;
  }

  return nextProfile;
}

function extractPatch(
  text: string,
  options: {
    allowLocation?: boolean;
    allowBudget?: boolean;
    allowBedrooms?: boolean;
    allowPets?: boolean;
    allowPetDetails?: boolean;
    allowRequirements?: boolean;
    allowDealbreakersOnly?: boolean;
  }
): Partial<DraftProfile> {
  const patch: Partial<DraftProfile> = {};

  if (options.allowLocation) {
    const state = extractState(text);
    if (state) {
      patch.state = state;
    }

    const cities = extractCities(text, state);
    if (cities.length) {
      patch.cities = cities;
      patch.locations = cities;
    }
  }

  if (options.allowBedrooms) {
    const bedrooms = extractBedrooms(text);
    if (bedrooms) {
      patch.minBedrooms = bedrooms.minBedrooms;
      patch.maxBedrooms = bedrooms.maxBedrooms;
    }
  }

  if (options.allowBudget) {
    const budget = extractBudget(text);
    if (budget != null) {
      patch.maxBudget = budget;
    }
  }

  if (options.allowPets || options.allowPetDetails) {
    const petPatch = extractPetDetails(text);
    Object.assign(patch, petPatch);
  }

  if (options.allowRequirements) {
    const requirements = extractRequirements(text);
    Object.assign(patch, requirements);
  }

  if (options.allowDealbreakersOnly) {
    const dealbreakers = extractDealbreakersOnly(text);
    if (dealbreakers.length) {
      patch.dealbreakers = dealbreakers;
    }
  }

  return patch;
}

function extractState(text: string): string | undefined {
  const normalized = text.toLowerCase();

  for (const [candidate, fullName] of Object.entries(US_STATES)) {
    if (candidate.length === 2) {
      continue;
    }

    const pattern = new RegExp(
      `(^|[^a-z])${escapeRegExp(candidate)}([^a-z]|$)`,
      "i"
    );
    if (pattern.test(normalized)) {
      return fullName;
    }
  }

  for (const [candidate, fullName] of Object.entries(US_STATES)) {
    if (candidate.length !== 2) {
      continue;
    }

    const pattern = new RegExp(`\\b${escapeRegExp(candidate.toUpperCase())}\\b`);
    if (pattern.test(text)) {
      return fullName;
    }
  }

  return undefined;
}

function extractCities(text: string, state?: string): string[] {
  let cleaned = text;

  if (state) {
    cleaned = cleaned.replace(new RegExp(state, "ig"), " ");
  }

  cleaned = cleaned.replace(/\b[A-Z]{2}\b/g, " ");

  cleaned = cleaned
    .replace(/\b(i('| a)?m|looking|searching|focus|cities|city|in|for|on|around|to|be|should|change|location)\b/gi, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return [];
  }

  return uniqueStrings(
    cleaned
      .split(/,|\/|;|\band\b|\bor\b/gi)
      .map((part) => normalizeCity(part))
      .filter(Boolean)
  );
}

function extractBedrooms(
  text: string
): { minBedrooms: number; maxBedrooms: number } | null {
  const rangeMatch = text.match(
    /(\d+)\s*(?:-|to|or)\s*(\d+)(?:\s*(?:bed|bedroom|br)s?)?/i
  );
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return { minBedrooms: Math.min(min, max), maxBedrooms: Math.max(min, max) };
  }

  const singleMatch =
    text.match(/(\d+)\s*(?:bed|bedroom|br)s?\b/i) ??
    text.match(/^\s*(\d+)\s*$/);
  if (!singleMatch) {
    return null;
  }

  const value = Number(singleMatch[1]);
  return { minBedrooms: value, maxBedrooms: value };
}

function extractBudget(text: string): number | undefined {
  const match = text.match(/(?:\$|budget|rent|max|up to)?\s*(\d[\d,]*)(?:\s*(k))?/i);
  if (!match) {
    return undefined;
  }

  const base = Number(match[1].replace(/,/g, ""));
  if (Number.isNaN(base)) {
    return undefined;
  }

  if (!match[2] && !match[0].includes("$") && base < 500) {
    return undefined;
  }

  return match[2] ? base * 1000 : base;
}

function extractPetDetails(text: string): Partial<DraftProfile> {
  const lower = text.toLowerCase();

  if (/\bno pets?\b|\bdon't have pets?\b|\bdo not have pets?\b/.test(lower)) {
    return { hasPet: false };
  }

  const hasPetAnswer = /\byes\b|\bpet\b|\bdog\b|\bcat\b/.test(lower);
  if (!hasPetAnswer) {
    return {};
  }

  const patch: Partial<DraftProfile> = { hasPet: true };

  if (/\bdog\b/.test(lower)) {
    patch.petType = "dog";
  } else if (/\bcat\b/.test(lower)) {
    patch.petType = "cat";
  } else if (/\bpet\b/.test(lower)) {
    patch.petType = "pet";
  }

  const weightMatch = lower.match(/(\d+)\s*(?:lb|lbs|pounds?)/);
  if (weightMatch) {
    patch.petWeightLbs = Number(weightMatch[1]);
  }

  return patch;
}

function extractRequirements(text: string): Partial<DraftProfile> {
  const fragments = splitRequirementFragments(text);
  const mustHaves: string[] = [];
  const niceToHaves: string[] = [];
  const dealbreakers: string[] = [];
  const customQuestions: string[] = [];

  for (const fragment of fragments) {
    const lower = fragment.toLowerCase();
    if (!lower) {
      continue;
    }

    if (QUESTION_HINTS.some((hint) => lower.includes(hint))) {
      customQuestions.push(cleanQuestion(fragment));
      continue;
    }

    if (NEGATIVE_HINTS.some((hint) => lower.includes(hint))) {
      dealbreakers.push(normalizeRequirement(fragment));
      continue;
    }

    if (NICE_TO_HAVE_HINTS.some((hint) => lower.includes(hint))) {
      niceToHaves.push(normalizeRequirement(fragment));
      continue;
    }

    mustHaves.push(normalizeRequirement(fragment));
  }

  return {
    notes: text.trim(),
    mustHaves,
    niceToHaves,
    dealbreakers,
    customQuestions,
  };
}

function extractDealbreakersOnly(text: string): string[] {
  return splitRequirementFragments(text).map(normalizeRequirement).filter(Boolean);
}

function splitRequirementFragments(text: string): string[] {
  return text
    .split(/\n|[.;]|,(?!\d)|\band\b/gi)
    .map((part) =>
      part
        .replace(/\b(i need|need|looking for|must have|must be|want|would love|please|include)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

function normalizeRequirement(fragment: string): string {
  return fragment
    .replace(/\b(dealbreaker|must have|question to ask|ask about)\b/gi, " ")
    .replace(/[?!]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanQuestion(fragment: string): string {
  return fragment
    .replace(/\b(ask about|please ask|can you ask|question to ask|ask)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[a-z]/, (char) => char.toUpperCase())
    .replace(/\?*$/, "?");
}

function getLatestUserMessage(messages: Message[]): Message | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messages[index];
    }
  }

  return undefined;
}

function getPreviousAgentMessage(messages: Message[]): Message | undefined {
  for (let index = messages.length - 2; index >= 0; index -= 1) {
    if (messages[index].role === "agent") {
      return messages[index];
    }
  }

  return undefined;
}

function getPendingEdit(message: string): PendingEdit {
  const lower = message.toLowerCase();

  if (lower.includes("change your location")) {
    return "location";
  }

  if (lower.includes("change your budget")) {
    return "budget";
  }

  if (lower.includes("extra must-have") || lower.includes("call question")) {
    return "requirements";
  }

  return null;
}

function wasAskedOpenEnded(message: string): boolean {
  return message.toLowerCase().includes("what else do you need in the home");
}

function wasAskedDealbreaker(message: string): boolean {
  return message.toLowerCase().includes("immediately pass on a place");
}

function isExplicitConfirm(message: string): boolean {
  const lower = message.toLowerCase();
  return CONFIRM_HINTS.some((hint) => lower.includes(hint));
}

function getCollectionStage(profile: Partial<DraftProfile>): CollectionStage {
  if (!profile.state) {
    return "state";
  }

  if (!profile.cities?.length) {
    return "cities";
  }

  if (!hasBedrooms(profile)) {
    return "bedrooms";
  }

  if (profile.maxBudget == null) {
    return "budget";
  }

  if (profile.hasPet == null) {
    return "pets";
  }

  if (profile.hasPet && !hasPetDetails(profile)) {
    return "petDetails";
  }

  if (!profile.notes?.trim()) {
    return "requirements";
  }

  if (!profile.dealbreakers?.length) {
    return "dealbreakers";
  }

  return "review";
}

function getExtractionOptions(
  stage: CollectionStage,
  previousAgentMessage: string
): {
  allowLocation?: boolean;
  allowBudget?: boolean;
  allowBedrooms?: boolean;
  allowPets?: boolean;
  allowPetDetails?: boolean;
  allowRequirements?: boolean;
  allowDealbreakersOnly?: boolean;
} {
  if (stage === "state" || stage === "cities") {
    return { allowLocation: true };
  }

  if (stage === "bedrooms") {
    return { allowBedrooms: true, allowBudget: true };
  }

  if (stage === "budget") {
    return { allowBudget: true };
  }

  if (stage === "pets" || stage === "petDetails") {
    return { allowPets: true, allowPetDetails: true };
  }

  if (stage === "requirements") {
    return {
      allowRequirements: wasAskedOpenEnded(previousAgentMessage),
    };
  }

  if (stage === "dealbreakers") {
    return {
      allowDealbreakersOnly: wasAskedDealbreaker(previousAgentMessage),
    };
  }

  return {};
}

function isBareLocationChangeRequest(message: string): boolean {
  return /^(change (the )?location|change city|change cities)$/i.test(
    message.trim()
  );
}

function isBareBudgetChangeRequest(message: string): boolean {
  return /^(change (the )?budget)$/i.test(message.trim());
}

function isBareRequirementsChangeRequest(message: string): boolean {
  return /^(add another requirement|add requirement|change requirements|change must-have)$/i.test(
    message.trim()
  );
}

function looksLikeRequirementText(message: string): boolean {
  return /\?|need|must|want|ask|dealbreaker|avoid|without|no |bonus|ideally|add another requirement/i.test(
    message
  );
}

function isReadyForReview(profile: Partial<DraftProfile>): boolean {
  return (
    Boolean(profile.state) &&
    Boolean(profile.cities?.length) &&
    hasBedrooms(profile) &&
    profile.maxBudget != null &&
    profile.hasPet != null &&
    hasPetDetails(profile) &&
    Boolean(profile.notes?.trim()) &&
    Boolean(profile.dealbreakers?.length)
  );
}

function hasBedrooms(profile: Partial<DraftProfile>): boolean {
  return profile.minBedrooms != null || profile.maxBedrooms != null;
}

function hasPetDetails(profile: Partial<DraftProfile>): boolean {
  if (profile.hasPet === false) {
    return true;
  }

  if (profile.hasPet !== true) {
    return false;
  }

  return Boolean(profile.petType) && profile.petWeightLbs != null;
}

function formatBedrooms(profile: Partial<DraftProfile>): string {
  if (profile.minBedrooms == null && profile.maxBedrooms == null) {
    return "Not set";
  }

  if (
    profile.minBedrooms != null &&
    profile.maxBedrooms != null &&
    profile.minBedrooms !== profile.maxBedrooms
  ) {
    return `${profile.minBedrooms}-${profile.maxBedrooms}`;
  }

  return String(profile.minBedrooms ?? profile.maxBedrooms);
}

function formatBudget(budget?: number): string {
  return budget != null ? `Up to $${budget.toLocaleString()}/mo` : "Not set";
}

function formatPets(profile: Partial<DraftProfile>): string {
  if (profile.hasPet === false) {
    return "No pets";
  }

  if (profile.hasPet !== true) {
    return "Not set";
  }

  const petDetails = [profile.petType ? toDisplayText(profile.petType) : "Pet"];
  if (profile.petWeightLbs != null) {
    petDetails.push(`${profile.petWeightLbs} lbs`);
  }
  return petDetails.join(", ");
}

function normalizeState(state: string): string {
  const key = state.trim().toLowerCase();
  return US_STATES[key] ?? toTitleCase(state);
}

function normalizeCity(city: string): string {
  return toTitleCase(
    city
      .replace(/\b(city|cities)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toDisplayText(value: string): string {
  return value.replace(/_/g, " ");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const nextValues: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      nextValues.push(trimmed);
    }
  }

  return nextValues;
}

function profilesEqual(
  left: Partial<DraftProfile>,
  right: Partial<DraftProfile>
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
