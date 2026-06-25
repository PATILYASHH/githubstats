import { createClient } from "@supabase/supabase-js";

// Admin client — uses the service-role key and BYPASSES Row-Level Security.
// SERVER ONLY. Never import this into a Client Component or anything that ships
// to the browser. Used by the snapshot cron and on-demand stat refreshes.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
