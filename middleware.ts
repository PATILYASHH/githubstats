import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on page routes only. Exclude static assets, and crucially /auth and
  // /api: the OAuth callback exchanges the code and sets the session cookies
  // itself, so middleware must not run there and race the PKCE verifier cookie.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
