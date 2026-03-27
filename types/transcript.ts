export type CallType = "prescreen" | "deepscreen";

export type CallOutcome =
  | "PASS"
  | "FAIL"
  | "VOICEMAIL"
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "COMPLIANCE_VIOLATION";

export interface CallTranscript {
  id: string;
  userId: string;
  listingId: string;
  callType: CallType;
  callId: string | null;
  phoneNumber: string | null;
  durationSeconds: number | null;
  transcript: string;
  extractedData: Record<string, unknown> | null;
  outcome: CallOutcome;
  failureReason: string | null;
  complianceViolation: boolean;
  complianceNotes: string | null;
  calledAt: string;
  managementScore: number | null;
  noiseScore: number | null;
  valueScore: number | null;
  flexibilityScore: number | null;
  overallScore: number | null;
}
