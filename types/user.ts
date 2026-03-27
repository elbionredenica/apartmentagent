export interface Preferences {
  state?: string;
  cities?: string[];
  locations: string[];
  minBathrooms?: number;
  mustHaves: string[];
  niceToHaves: string[];
  moveInTimeline?: string;
  customQuestions: string[];
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  maxBudget: number;
  minBedrooms: number;
  maxBedrooms: number;
  hasPet: boolean;
  petType: string | null;
  petWeightLbs: number | null;
  dealbreakers: string[];
  preferences: Preferences;
  learnedPreferences: Record<string, unknown>;
}

export interface DraftProfile {
  state?: string;
  cities?: string[];
  maxBudget?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  hasPet?: boolean;
  petType?: string;
  petWeightLbs?: number;
  dealbreakers?: string[];
  locations?: string[];
  mustHaves?: string[];
  niceToHaves?: string[];
  moveInTimeline?: string;
  customQuestions?: string[];
  notes?: string;
}
