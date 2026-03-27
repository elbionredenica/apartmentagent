import type { DraftProfile } from "./user";

export type ChatPhase = "collecting" | "review" | "confirmed";

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  messages: Message[];
  draftProfile: Partial<DraftProfile>;
}

export interface ChatResponse {
  phase: ChatPhase;
  message: string;
  profilePatch: Partial<DraftProfile>;
  missingFields: string[];
  quickReplies?: string[];
  readyToStart: boolean;
  action?: "START_SEARCH";
  preferences?: DraftProfile;
}
