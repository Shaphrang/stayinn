import { getSupabaseEnv } from "@/lib/supabase/env";

export async function supabaseAuthUser(token: string) {
  const { url, publishableKey } = getSupabaseEnv();
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function supabaseSelect<T>(table: string, select: string, token: string, extra = ""): Promise<T[]> {
  const { url, publishableKey } = getSupabaseEnv();
  const q = `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}`;
  const res = await fetch(q, { headers: { apikey: publishableKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed query for ${table}`);
  return res.json();
}
