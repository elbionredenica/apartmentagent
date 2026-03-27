import type { Viewer } from "@/lib/session";

export interface BackendUser {
  id: string;
  email: string;
  onboarding_complete?: boolean;
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function resolveBackendUserForViewer(
  viewer: Viewer
): Promise<BackendUser | null> {
  if (!viewer) {
    return null;
  }

  if (viewer.mode === "demo") {
    return {
      id: viewer.userId,
      email: viewer.email ?? "",
      onboarding_complete: true,
    };
  }

  if (!viewer.email) {
    return null;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/users/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: viewer.email }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve backend user: ${await response.text()}`);
  }

  return (await response.json()) as BackendUser;
}
