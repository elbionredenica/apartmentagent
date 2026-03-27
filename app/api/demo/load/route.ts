import { NextResponse } from "next/server";
import { setUserSession } from "@/lib/session";

export async function POST() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const response = await fetch(`${apiBaseUrl}/api/demo/user`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to load demo user" },
      { status: 500 }
    );
  }

  const user = await response.json();
  const userId = user.id as string;

  await setUserSession(userId);

  return NextResponse.json({ userId, seeded: true });
}
