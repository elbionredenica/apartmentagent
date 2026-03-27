import type {
  ChatRequest,
  ChatResponse,
  DraftProfile,
} from "../types/index.ts";
import { mergeDraftProfile } from "./chat-intake.ts";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const ALLOWED_MISSING_FIELDS = new Set([
  "state",
  "cities",
  "budget",
  "bedrooms",
  "petDetails",
  "dealbreakers",
  "confirmation",
]);

type FetchLike = typeof fetch;

interface RawModelChatResponse {
  phase?: "collecting" | "review" | "confirmed";
  message?: string | null;
  profilePatch?: NullableDraftProfile | null;
  missingFields?: string[];
  quickReplies?: string[];
  readyToStart?: boolean;
  action?: "START_SEARCH" | null;
  preferences?: NullableDraftProfile | null;
}

type NullableDraftProfile = {
  [Key in keyof DraftProfile]?: DraftProfile[Key] | null;
};

export function shouldUseModelGeneratedChat(): boolean {
  return (
    Boolean(process.env.OPENROUTER_API_KEY) &&
    process.env.ENABLE_LIVE_CHAT !== "false"
  );
}

export async function getModelGeneratedChatResponse(
  request: ChatRequest,
  fetcher: FetchLike = fetch
): Promise<ChatResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for model-generated chat.");
  }

  const response = await fetcher(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_BASE_URL || "http://localhost:3000",
      "X-Title": "ApartmentAgent",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: buildDeveloperPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify({
            draftProfile: request.draftProfile,
            messages: request.messages,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "apartment_chat_response",
          strict: true,
          schema: CHAT_RESPONSE_SCHEMA,
        },
      },
      temperature: 0.2,
      max_completion_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter chat completions failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
              type?: string;
              text?: string;
            }>;
        refusal?: string;
      };
    }>;
  };

  const refusal = extractRefusal(payload);
  if (refusal) {
    throw new Error(`Model refused chat response generation: ${refusal}`);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("OpenRouter returned no structured output text.");
  }

  const parsed = JSON.parse(outputText) as RawModelChatResponse;
  return normalizeModelChatResponse(request.draftProfile, parsed);
}

function normalizeModelChatResponse(
  currentProfile: Partial<DraftProfile>,
  raw: RawModelChatResponse
): ChatResponse {
  const mergedProfile = mergeDraftProfile(
    currentProfile,
    sanitizeDraftProfile(raw.profilePatch)
  );
  const normalizedPhase = raw.phase ?? "collecting";
  const quickReplies = normalizeQuickReplies(raw.quickReplies);
  const message = raw.message?.trim() || "Tell me more about what you're looking for.";

  if (normalizedPhase === "confirmed") {
    const preferences = mergeDraftProfile(
      mergedProfile,
      sanitizeDraftProfile(raw.preferences)
    );
    return {
      phase: "confirmed",
      message,
      profilePatch: preferences,
      missingFields: [],
      quickReplies: [],
      readyToStart: true,
      action: "START_SEARCH",
      preferences,
    };
  }

  if (normalizedPhase === "review") {
    return {
      phase: "review",
      message,
      profilePatch: mergedProfile,
      missingFields: ["confirmation"],
      quickReplies:
        quickReplies.length > 0
          ? quickReplies
          : [
              "Looks right, start calling",
              "Change location",
              "Change budget",
              "Add another requirement",
            ],
      readyToStart: false,
    };
  }

  return {
    phase: "collecting",
    message,
    profilePatch: mergedProfile,
    missingFields: normalizeMissingFields(raw.missingFields),
    quickReplies,
    readyToStart: false,
  };
}

function normalizeMissingFields(fields: string[] | undefined): string[] {
  if (!fields) {
    return [];
  }

  return fields.filter((field) => ALLOWED_MISSING_FIELDS.has(field));
}

function normalizeQuickReplies(replies: string[] | undefined): string[] {
  if (!replies) {
    return [];
  }

  return replies
    .map((reply) => reply.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function sanitizeDraftProfile(
  profile: NullableDraftProfile | null | undefined
): Partial<DraftProfile> {
  if (!profile) {
    return {};
  }

  const nextProfile: Partial<DraftProfile> = {};

  if (typeof profile.state === "string") {
    nextProfile.state = profile.state;
  }

  if (Array.isArray(profile.cities)) {
    nextProfile.cities = profile.cities.filter(
      (value): value is string => typeof value === "string"
    );
  }

  if (Array.isArray(profile.locations)) {
    nextProfile.locations = profile.locations.filter(
      (value): value is string => typeof value === "string"
    );
  }

  if (typeof profile.maxBudget === "number") {
    nextProfile.maxBudget = profile.maxBudget;
  }

  if (typeof profile.minBedrooms === "number") {
    nextProfile.minBedrooms = profile.minBedrooms;
  }

  if (typeof profile.maxBedrooms === "number") {
    nextProfile.maxBedrooms = profile.maxBedrooms;
  }

  if (typeof profile.hasPet === "boolean") {
    nextProfile.hasPet = profile.hasPet;
  }

  if (typeof profile.petType === "string") {
    nextProfile.petType = profile.petType;
  }

  if (typeof profile.petWeightLbs === "number") {
    nextProfile.petWeightLbs = profile.petWeightLbs;
  }

  if (Array.isArray(profile.dealbreakers)) {
    nextProfile.dealbreakers = profile.dealbreakers.filter(
      (value): value is string => typeof value === "string"
    );
  }

  if (Array.isArray(profile.mustHaves)) {
    nextProfile.mustHaves = profile.mustHaves.filter(
      (value): value is string => typeof value === "string"
    );
  }

  if (Array.isArray(profile.niceToHaves)) {
    nextProfile.niceToHaves = profile.niceToHaves.filter(
      (value): value is string => typeof value === "string"
    );
  }

  if (typeof profile.moveInTimeline === "string") {
    nextProfile.moveInTimeline = profile.moveInTimeline;
  }

  if (Array.isArray(profile.customQuestions)) {
    nextProfile.customQuestions = profile.customQuestions.filter(
      (value): value is string => typeof value === "string"
    );
  }

  if (typeof profile.notes === "string") {
    nextProfile.notes = profile.notes;
  }

  return nextProfile;
}

function extractOutputText(payload: {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
}): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      if (
        (part.type === "output_text" || part.type === "text") &&
        typeof part.text === "string" &&
        part.text.trim()
      ) {
        return part.text;
      }
    }
  }

  return "";
}

function extractRefusal(payload: {
  choices?: Array<{
    message?: {
      refusal?: string;
    };
  }>;
}): string | null {
  const refusal = payload.choices?.[0]?.message?.refusal;
  if (typeof refusal === "string" && refusal.trim()) {
    return refusal;
  }

  return null;
}

function buildDeveloperPrompt(): string {
  return [
    "You are the ApartmentAgent intake model.",
    "Generate the next assistant turn and the updated intake state as JSON.",
    "Everything user-facing must be model-authored: the next question, the review summary, and quick replies.",
    "Follow this intake order exactly:",
    "1. state",
    "2. city or cities",
    "3. bedrooms",
    "4. max budget",
    "5. pets, and pet details if pets exist",
    "6. one open-ended needs question covering must-haves, dealbreakers, and call questions",
    "7. a dedicated dealbreaker question only if the open-ended answer did not already produce at least one dealbreaker",
    "8. a review summary asking what to change or add",
    '9. only return phase="confirmed" when the latest user message is an explicit confirmation such as "Looks right, start calling".',
    "Use these phase rules:",
    '- phase="collecting" while gathering information',
    '- phase="review" after all required fields are present and before explicit confirmation',
    '- phase="confirmed" only on explicit confirmation',
    "Required before review: state, at least one city, bedrooms, maxBudget, pet details if hasPet=true, and at least one dealbreaker.",
    "Store the complete updated profile in profilePatch, not just a delta.",
    "You must include every key from the schema on every response. Use null for values that are unknown or not applicable yet.",
    "Derive locations from cities by mirroring cities into locations.",
    "Preserve the user's open-ended needs in notes.",
    "Extract positive requirements into mustHaves, optional bonuses into niceToHaves, and questions for calls into customQuestions.",
    "Use missingFields only from this set: state, cities, budget, bedrooms, petDetails, dealbreakers, confirmation.",
    "Set readyToStart to true only when phase is confirmed.",
    'Set action to "START_SEARCH" only when phase is confirmed.',
    "When phase is review, create a readable multi-line summary in message.",
    "Return concise quickReplies that fit the current turn. For review, include a confirmation option and a couple of edit options.",
    "Do not ask about protected classes or anything that would violate fair housing rules.",
  ].join("\n");
}

const CHAT_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    phase: {
      type: "string",
      enum: ["collecting", "review", "confirmed"],
    },
    message: {
      type: "string",
    },
    profilePatch: {
      type: "object",
      additionalProperties: false,
      properties: {
        state: { type: ["string", "null"] },
        cities: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        locations: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        maxBudget: { type: ["number", "null"] },
        minBedrooms: { type: ["number", "null"] },
        maxBedrooms: { type: ["number", "null"] },
        hasPet: { type: ["boolean", "null"] },
        petType: { type: ["string", "null"] },
        petWeightLbs: { type: ["number", "null"] },
        dealbreakers: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        mustHaves: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        niceToHaves: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        moveInTimeline: { type: ["string", "null"] },
        customQuestions: {
          type: ["array", "null"],
          items: { type: "string" },
        },
        notes: { type: ["string", "null"] },
      },
      required: [
        "state",
        "cities",
        "locations",
        "maxBudget",
        "minBedrooms",
        "maxBedrooms",
        "hasPet",
        "petType",
        "petWeightLbs",
        "dealbreakers",
        "mustHaves",
        "niceToHaves",
        "moveInTimeline",
        "customQuestions",
        "notes",
      ],
    },
    missingFields: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "state",
          "cities",
          "budget",
          "bedrooms",
          "petDetails",
          "dealbreakers",
          "confirmation",
        ],
      },
    },
    quickReplies: {
      type: "array",
      items: { type: "string" },
    },
    readyToStart: {
      type: "boolean",
    },
    action: {
      type: ["string", "null"],
      enum: ["START_SEARCH", null],
    },
    preferences: {
      anyOf: [
        {
          type: "null",
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            state: { type: ["string", "null"] },
            cities: {
              type: ["array", "null"],
              items: { type: "string" },
            },
            locations: {
              type: ["array", "null"],
              items: { type: "string" },
            },
            maxBudget: { type: ["number", "null"] },
            minBedrooms: { type: ["number", "null"] },
            maxBedrooms: { type: ["number", "null"] },
            hasPet: { type: ["boolean", "null"] },
            petType: { type: ["string", "null"] },
            petWeightLbs: { type: ["number", "null"] },
            dealbreakers: {
              type: ["array", "null"],
              items: { type: "string" },
            },
            mustHaves: {
              type: ["array", "null"],
              items: { type: "string" },
            },
            niceToHaves: {
              type: ["array", "null"],
              items: { type: "string" },
            },
            moveInTimeline: { type: ["string", "null"] },
            customQuestions: {
              type: ["array", "null"],
              items: { type: "string" },
            },
            notes: { type: ["string", "null"] },
          },
          required: [
            "state",
            "cities",
            "locations",
            "maxBudget",
            "minBedrooms",
            "maxBedrooms",
            "hasPet",
            "petType",
            "petWeightLbs",
            "dealbreakers",
            "mustHaves",
            "niceToHaves",
            "moveInTimeline",
            "customQuestions",
            "notes",
          ],
        },
      ],
    },
  },
  required: [
    "phase",
    "message",
    "profilePatch",
    "missingFields",
    "quickReplies",
    "readyToStart",
    "action",
    "preferences",
  ],
} as const;
