import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

export async function middleware(request: NextRequest) {
  try {
    return await auth0.middleware(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("JWEInvalid") || message.includes("Invalid Compact JWE")) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("__session");
      response.cookies.delete("appSession");
      return response;
    }

    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
