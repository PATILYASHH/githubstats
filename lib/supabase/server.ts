import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server client — reads the session from cookies. Use in Server Components,
// Route Handlers and Server Actions. Still bound by Row-Level Security.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by route handlers / middleware, so
            // this is safe to ignore.
          }
        },
      },
    }
  );
}
