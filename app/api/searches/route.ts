import { NextRequest, NextResponse } from "next/server";
import { getUserId, setSearchStarted } from "@/lib/session";

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { preferences } = await request.json();

  // Mode A: just acknowledge the search start
  // Mode B: update users table with preferences, trigger pipeline
  void preferences;
  await setSearchStarted(userId);

  return NextResponse.json({ userId, searchStarted: true });
}
