import { cookies } from "next/headers";

const USER_ID_COOKIE = "userId";

export async function getUserId(): Promise<string | null> {
  // Phase 2: if Auth0 is configured, use auth0.getSession() instead
  const cookieStore = await cookies();
  return cookieStore.get(USER_ID_COOKIE)?.value ?? null;
}

export async function setUserSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_ID_COOKIE);
}
