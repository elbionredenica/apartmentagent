import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest } from "@/types";
import { getChatResponse } from "@/lib/chat-intake";
import {
  getModelGeneratedChatResponse,
  shouldUseModelGeneratedChat,
} from "@/lib/model-generated-chat";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<ChatRequest>;
  const chatRequest: ChatRequest = {
    messages: body.messages ?? [],
    draftProfile: body.draftProfile ?? {},
  };

  if (shouldUseModelGeneratedChat()) {
    try {
      const response = await getModelGeneratedChatResponse(chatRequest);

      await new Promise((resolve) => setTimeout(resolve, 300));
      return NextResponse.json(response);
    } catch (error) {
      console.error("Model-generated chat failed, falling back to local intake.", error);
    }
  }

  const response = getChatResponse(chatRequest);

  // Simulate slight network delay for realism
  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json(response);
}
