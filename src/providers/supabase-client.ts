import { createClient } from "@refinedev/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./constants";

const getHeaders = () => {
  const headers: Record<string, string> = {};
  const mimicUserId = localStorage.getItem("mimic_user_id");
  if (mimicUserId) {
    // We send a custom header. The Postgres backend requires a custom RLS function to check this.
    // Example in Postgres: coalesce(current_setting('request.headers', true)::json->>'x-mimic-user-id', auth.uid()::text)
    headers["x-mimic-user-id"] = mimicUserId;
  }
  return headers;
};

export const supabaseClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    db: {
      schema: "public",
    },
    auth: {
      persistSession: true,
    },
    global: {
      headers: getHeaders(),
    },
  }
);
