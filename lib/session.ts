import { cookies } from "next/headers";
import { auth0 } from "@/lib/auth0";

const USER_ID_COOKIE = "userId";

export type Viewer =
  | {
      mode: "auth0" | "demo";
      userId: string;
      name?: string;
      email?: string;
      picture?: string;
    }
  | null;

function hasAuth0Config(): boolean {
  return Boolean(
    process.env.AUTH0_DOMAIN &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_SECRET &&
      process.env.AUTH0_CLIENT_SECRET
  );
}

async function getDemoViewer(): Promise<Viewer> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_ID_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  return {
    mode: "demo",
    userId,
    name: "Demo Session",
  };
}

export async function getViewer(): Promise<Viewer> {
  if (hasAuth0Config()) {
    try {
      const session = await auth0.getSession();
      const auth0User = session?.user;

      if (auth0User?.sub) {
        return {
          mode: "auth0",
          userId: auth0User.sub,
          name: auth0User.name,
          email: auth0User.email,
          picture: auth0User.picture,
        };
      }
    } catch {
      // Fall back to the demo cookie path when Auth0 isn't available.
    }
  }

  const demoViewer = await getDemoViewer();
  if (demoViewer) {
    return demoViewer;
  }

  return null;
}

export async function getUserId(): Promise<string | null> {
  return (await getViewer())?.userId ?? null;
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
