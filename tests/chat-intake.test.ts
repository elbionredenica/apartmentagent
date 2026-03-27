import test from "node:test";
import assert from "node:assert/strict";
import { getChatResponse } from "../lib/chat-intake.ts";

test("holds a no-pet user at review until explicit confirmation", () => {
  const response = getChatResponse({
    messages: [
      {
        id: "agent-1",
        role: "agent",
        content: "What would make you immediately pass on a place?",
        timestamp: new Date().toISOString(),
      },
      {
        id: "user-1",
        role: "user",
        content: "No smoking and no street parking.",
        timestamp: new Date().toISOString(),
      },
    ],
    draftProfile: {
      state: "California",
      cities: ["San Francisco"],
      minBedrooms: 2,
      maxBedrooms: 2,
      maxBudget: 3200,
      hasPet: false,
      notes: "Need in-unit laundry and a quiet building.",
      mustHaves: ["in-unit laundry", "quiet building"],
    },
  });

  assert.equal(response.phase, "review");
  assert.equal(response.readyToStart, false);
  assert.deepEqual(response.missingFields, ["confirmation"]);
  assert.match(response.message, /\n- State: California/);
});

test("asks for pet weight before review when the user has a pet", () => {
  const response = getChatResponse({
    messages: [
      {
        id: "agent-1",
        role: "agent",
        content: "Do you have any pets I should screen for?",
        timestamp: new Date().toISOString(),
      },
      {
        id: "user-1",
        role: "user",
        content: "Yes, dog.",
        timestamp: new Date().toISOString(),
      },
    ],
    draftProfile: {
      state: "California",
      cities: ["Oakland"],
      minBedrooms: 1,
      maxBedrooms: 1,
      maxBudget: 2800,
    },
  });

  assert.equal(response.phase, "collecting");
  assert.equal(response.readyToStart, false);
  assert.match(response.message, /what kind of pet/i);
  assert.equal(response.profilePatch.petType, "dog");
});

test("classifies open-ended needs into must-haves, dealbreakers, and questions", () => {
  const response = getChatResponse({
    messages: [
      {
        id: "agent-1",
        role: "agent",
        content:
          "What else do you need in the home you're searching for? Include must-haves, dealbreakers, and anything you want me to ask on the call.",
        timestamp: new Date().toISOString(),
      },
      {
        id: "user-1",
        role: "user",
        content:
          "I need in-unit laundry, no smoking, and ask how often rent increases",
        timestamp: new Date().toISOString(),
      },
    ],
    draftProfile: {
      state: "California",
      cities: ["Berkeley"],
      minBedrooms: 1,
      maxBedrooms: 2,
      maxBudget: 3000,
      hasPet: false,
    },
  });

  assert.equal(response.phase, "review");
  assert.deepEqual(response.profilePatch.mustHaves, ["in-unit laundry"]);
  assert.deepEqual(response.profilePatch.dealbreakers, ["no smoking"]);
  assert.deepEqual(response.profilePatch.customQuestions, [
    "How often rent increases?",
  ]);
  assert.equal(
    response.profilePatch.notes,
    "I need in-unit laundry, no smoking, and ask how often rent increases"
  );
});

test("review edits regenerate the summary without starting the search", () => {
  const response = getChatResponse({
    messages: [
      {
        id: "agent-1",
        role: "agent",
        content:
          "Here's what I'll screen for before I start calling.\n\n- State: California\n- Cities: Oakland\n\nWhat should I change or add?",
        timestamp: new Date().toISOString(),
      },
      {
        id: "user-1",
        role: "user",
        content: "Change budget to $3,500",
        timestamp: new Date().toISOString(),
      },
    ],
    draftProfile: {
      state: "California",
      cities: ["Oakland"],
      minBedrooms: 1,
      maxBedrooms: 1,
      maxBudget: 3000,
      hasPet: false,
      notes: "Need natural light and a quiet building.",
      mustHaves: ["natural light", "quiet building"],
      dealbreakers: ["no smoking"],
    },
  });

  assert.equal(response.phase, "review");
  assert.equal(response.readyToStart, false);
  assert.equal(response.profilePatch.maxBudget, 3500);
  assert.match(response.message, /\$3,500/);
});

test("asks for a dedicated dealbreaker if the open-ended answer has none", () => {
  const response = getChatResponse({
    messages: [
      {
        id: "agent-1",
        role: "agent",
        content:
          "What else do you need in the home you're searching for? Include must-haves, dealbreakers, and anything you want me to ask on the call.",
        timestamp: new Date().toISOString(),
      },
      {
        id: "user-1",
        role: "user",
        content: "Need in-unit laundry and a quiet building.",
        timestamp: new Date().toISOString(),
      },
    ],
    draftProfile: {
      state: "California",
      cities: ["San Jose"],
      minBedrooms: 2,
      maxBedrooms: 2,
      maxBudget: 3400,
      hasPet: false,
    },
  });

  assert.equal(response.phase, "collecting");
  assert.match(response.message, /immediately pass on a place/i);
  assert.deepEqual(response.missingFields, ["dealbreakers"]);
});

test("starts the search only after explicit confirmation", () => {
  const response = getChatResponse({
    messages: [
      {
        id: "agent-1",
        role: "agent",
        content:
          "Here's what I'll screen for before I start calling.\n\n- State: California\n- Cities: San Francisco\n\nWhat should I change or add?",
        timestamp: new Date().toISOString(),
      },
      {
        id: "user-1",
        role: "user",
        content: "Looks right, start calling",
        timestamp: new Date().toISOString(),
      },
    ],
    draftProfile: {
      state: "California",
      cities: ["San Francisco"],
      minBedrooms: 2,
      maxBedrooms: 3,
      maxBudget: 3600,
      hasPet: false,
      notes: "Need quiet, in-unit laundry, and strong natural light.",
      mustHaves: ["quiet", "in-unit laundry", "strong natural light"],
      dealbreakers: ["no smoking"],
    },
  });

  assert.equal(response.phase, "confirmed");
  assert.equal(response.readyToStart, true);
  assert.equal(response.action, "START_SEARCH");
  assert.equal(response.preferences?.state, "California");
});
