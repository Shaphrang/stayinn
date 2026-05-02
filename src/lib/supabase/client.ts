import { getSupabaseEnv } from "@/lib/supabase/env";

export async function loginWithPassword(email: string, password: string) {
  const { url, publishableKey } = getSupabaseEnv();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: publishableKey },
    body: JSON.stringify({ email, password }),
  });
  return res;
}
