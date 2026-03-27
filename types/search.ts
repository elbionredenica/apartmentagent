import type { DraftProfile } from "./user";

export interface SearchRequest {
  userId: string;
  preferences: DraftProfile;
}

export interface SearchResponse {
  userId: string;
  searchStarted: true;
}
