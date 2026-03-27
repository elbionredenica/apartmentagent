import { NextResponse } from "next/server";
import { clearSearchState, clearUserSession } from "@/lib/session";

export async function POST() {
  await clearSearchState();
  await clearUserSession();

  return NextResponse.json({ cleared: true });
}
