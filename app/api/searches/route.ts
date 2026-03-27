import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUserForViewer } from "@/lib/backend-user";
import { getViewer } from "@/lib/session";

export async function POST(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUser = await resolveBackendUserForViewer(viewer);
  if (!backendUser) {
    return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 });
  }

  const { preferences } = await request.json();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const response = await fetch(`${apiBaseUrl}/api/demo/run-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: backendUser.id,
      preferences,
      reset: true,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: "Failed to start search", details: errorText },
      { status: 500 }
    );
  }

  const result = await response.json();
  return NextResponse.json({
    userId: backendUser.id,
    searchStarted: true,
    ...result,
  });
}
