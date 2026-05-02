import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {

  return getSupabaseEnv();
}