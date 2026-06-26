import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Next 16 renamed `middleware` → `proxy`. This runs on the Node runtime, so
// reading the NextAuth JWT here is fine.
//
// Gate: a logged-in user who hasn't picked a real name + bio yet gets pushed to
// /onboarding before they can use the rest of the app. We detect "not onboarded"
// two ways so it works for both freshly-issued tokens (onboarded flag) and any
// older tokens minted before this feature (temp u_<hex> username).
const TEMP_USERNAME = /^u_[0-9a-f]{8}$/;

export async function proxy(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.isAdmin) return NextResponse.next();

  const needsOnboarding =
    token.onboarded === false || TEMP_USERNAME.test(token.username || "");

  if (needsOnboarding) {
    const url = new URL("/onboarding", request.url);
    // Preserve where they were headed so we can send them back after.
    url.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on page navigations only. Skip API routes, Next internals, the auth/login
  // and onboarding pages themselves, and any path with a file extension (static
  // assets like logo.png) — otherwise we'd redirect images to /onboarding.
  matcher: ["/((?!api|_next/static|_next/image|login|onboarding|favicon.ico|.*\\..*).*)"],
};
