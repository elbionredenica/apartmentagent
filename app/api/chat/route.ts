import { NextRequest, NextResponse } from "next/server";
import type { ChatResponse } from "@/types";
import { MOCK_CHAT_RESPONSES } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  // Count user messages to determine which scripted response to return
  const userMessageCount = messages.filter(
    (m: { role: string }) => m.role === "user"
  ).length;

  if (process.env.ENABLE_LIVE_CHAT === "true") {
    // Phase 2: forward to Claude API with preference extraction system prompt
    // For now, fall through to mock
  }

  // Mock mode: return scripted response based on conversation progress
  const responseIndex = Math.min(
    userMessageCount,
    MOCK_CHAT_RESPONSES.length - 1
  );
  const response: ChatResponse = MOCK_CHAT_RESPONSES[responseIndex];

  // Simulate slight network delay for realism
  await new Promise((resolve) => setTimeout(resolve, 800));

  return NextResponse.json(response);
}
