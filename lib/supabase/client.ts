import { createBrowserClient } from "@supabase/ssr";

// Browser client — uses the public anon key and is bound by Row-Level Security.
// Returns null when Supabase isn't configured (e.g. env vars not yet set on the
// deployment) so callers can degrade gracefully instead of crashing the page.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
