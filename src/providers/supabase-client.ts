import { createClient } from "@refinedev/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./constants";

const getHeaders = () => {
  // We no longer send mimic headers to the database. 
  // This ensures the Admin retains their RLS permissions (power) while mimicking.
  // Mimicking is now handled entirely at the UI level via identity and org state.
  return {};
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
