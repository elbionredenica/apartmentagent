import type { DraftProfile } from "./user";

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
  message: string;
  profilePatch: Partial<DraftProfile>;
  missingFields: string[];
  readyToStart: boolean;
  action?: "START_SEARCH";
  preferences?: DraftProfile;
}
