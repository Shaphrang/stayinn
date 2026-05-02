import { getSupabaseEnv } from "@/lib/supabase/env";

export async function supabaseSelect<T>(
  table: string,
  select: string,
  extra = "",
  accessToken?: string,
): Promise<T[]> {
  const { url, publishableKey } = getSupabaseEnv();
  const q = `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}`;
  const headers: HeadersInit = { apikey: publishableKey };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(q, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed query for ${table}`);
  return res.json();
}
