import test from "node:test";
import assert from "node:assert/strict";
import {
  getModelGeneratedChatResponse,
  shouldUseModelGeneratedChat,
} from "../lib/model-generated-chat.ts";

test("uses model-generated chat when an OpenRouter API key exists", () => {
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalToggle = process.env.ENABLE_LIVE_CHAT;

  process.env.OPENROUTER_API_KEY = "test-key";
  delete process.env.ENABLE_LIVE_CHAT;

  assert.equal(shouldUseModelGeneratedChat(), true);

  process.env.OPENROUTER_API_KEY = originalKey;
  process.env.ENABLE_LIVE_CHAT = originalToggle;
});

test("normalizes model-generated review responses", async () => {
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "test-key";

  const response = await getModelGeneratedChatResponse(
    {
      messages: [],
      draftProfile: {},
    },
    async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  phase: "review",
                  message:
                    "Here's what I'll screen for before I start calling.\n\n- State: California\n- Cities: San Francisco\n\nWhat should I change or add?",
                  profilePatch: {
                    state: "California",
                    cities: ["San Francisco"],
                    maxBudget: 3200,
                    minBedrooms: 2,
                    maxBedrooms: 2,
                    hasPet: false,
                    dealbreakers: ["no smoking"],
                    mustHaves: ["in-unit laundry"],
                    notes: "Need in-unit laundry and a quiet building.",
                  },
                  missingFields: ["confirmation"],
                  quickReplies: [
                    "Looks right, start calling",
                    "Change budget",
                  ],
                  readyToStart: false,
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
  );

  assert.equal(response.phase, "review");
  assert.equal(response.readyToStart, false);
  assert.deepEqual(response.profilePatch.locations, ["San Francisco"]);
  assert.deepEqual(response.missingFields, ["confirmation"]);

  process.env.OPENROUTER_API_KEY = originalKey;
});

test("normalizes model-generated confirmed responses into a start action", async () => {
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "test-key";

  const response = await getModelGeneratedChatResponse(
    {
      messages: [],
      draftProfile: {
        state: "California",
        cities: ["Oakland"],
      },
    },
    async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  phase: "confirmed",
                  message: "Looks right. Starting the calling flow now.",
                  profilePatch: {
                    state: "California",
                    cities: ["Oakland"],
                    maxBudget: 3000,
                    minBedrooms: 1,
                    maxBedrooms: 2,
                    hasPet: false,
                    dealbreakers: ["no smoking"],
                    notes: "Need natural light.",
                  },
                  missingFields: [],
                  quickReplies: [],
                  readyToStart: true,
                  action: "START_SEARCH",
                  preferences: {
                    mustHaves: ["natural light"],
                  },
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
  );

  assert.equal(response.phase, "confirmed");
  assert.equal(response.readyToStart, true);
  assert.equal(response.action, "START_SEARCH");
  assert.deepEqual(response.preferences?.locations, ["Oakland"]);
  assert.deepEqual(response.preferences?.mustHaves, ["natural light"]);

  process.env.OPENROUTER_API_KEY = originalKey;
});
