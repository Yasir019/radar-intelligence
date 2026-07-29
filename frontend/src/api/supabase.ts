import { createClient } from "@supabase/supabase-js";

// The anon key is safe to ship in the client bundle by design —
// it only allows what Supabase Auth policies permit.
const SUPABASE_URL = "https://knylivndkkisethteqdq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueWxpdm5ka2tpc2V0aHRlcWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjM0MzYsImV4cCI6MjEwMDE5OTQzNn0.AXJsOcWAnnD_9AWeTyh1oSFj5Jsi7h62Gj8yx7I4jmQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
