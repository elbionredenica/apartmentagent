import { NextResponse } from "next/server";
import { clearSearchState, setUserSession } from "@/lib/session";
import { DEMO_USER_ID } from "@/lib/mock-data";

export async function POST() {
  // Mode A: use hardcoded demo user ID from mock data
  // Mode B: query database for demo user
  const userId = DEMO_USER_ID;

  await clearSearchState();
  await setUserSession(userId);

  return NextResponse.json({ userId, seeded: true });
}
