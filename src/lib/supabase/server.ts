import { getSupabaseEnv } from "@/lib/supabase/env";

export async function supabaseSelect<T>(table: string, select: string, extra = ""): Promise<T[]> {
  const { url, publishableKey } = getSupabaseEnv();
  const q = `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}`;
  const res = await fetch(q, { headers: { apikey: publishableKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed query for ${table}`);
  return res.json();
}

async function writeRequest(table: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, filter = "") {
  const { url, publishableKey, serviceRoleKey } = getSupabaseEnv();
  const q = `${url}/rest/v1/${table}${filter ? `?${filter}` : ""}`;
  const res = await fetch(q, {
    method,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed ${method} ${table}`);
  }
  return res.status === 204 ? [] : res.json();
}

export async function supabaseInsert(table: string, payload: unknown) {
  return writeRequest(table, "POST", payload);
}

export async function supabasePatch(table: string, payload: unknown, filter: string) {
  return writeRequest(table, "PATCH", payload, filter);
}

export async function supabaseDelete(table: string, filter: string) {
  return writeRequest(table, "DELETE", undefined, filter);
}
