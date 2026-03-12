import { createClient } from "@refinedev/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./constants";

const getHeaders = () => {
  if (typeof window === "undefined") return {};
  
  const headers: Record<string, string> = {};
  const mimicId = localStorage.getItem("mimic_user_id");
  
  if (mimicId) {
    // Standard header for Supabase RLS mimicry support
    headers["x-mimic-user-id"] = mimicId;
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
