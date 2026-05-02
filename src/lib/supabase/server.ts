import { getSupabaseEnv } from "@/lib/supabase/env";

export async function supabaseSelect<T>(table: string, select: string, extra = ""): Promise<T[]> {
  const { url, publishableKey } = getSupabaseEnv();
  const q = `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}`;
  const res = await fetch(q, { headers: { apikey: publishableKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed query for ${table}`);
  return res.json();
}
