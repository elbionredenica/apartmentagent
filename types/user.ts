export interface Preferences {
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
  maxBudget?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  hasPet?: boolean;
  petType?: string;
  petWeightLbs?: number;
  dealbreakers?: string[];
  locations?: string[];
  mustHaves?: string[];
  moveInTimeline?: string;
  customQuestions?: string[];
}
