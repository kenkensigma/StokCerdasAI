import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getServerEnv } from "@/lib/validations/env";

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must only be executed on the server");
  }

  const env = getServerEnv();

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

