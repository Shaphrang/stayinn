import { getSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  return getSupabaseEnv();
}
