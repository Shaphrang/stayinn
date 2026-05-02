const SUPABASE_URL_KEYS = ["NEXT_PUBLIC_SUPABASE_URL"] as const;
const SUPABASE_PUBLIC_KEY_KEYS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

function readFirst(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) return value;
  }
  return null;
}

export function getSupabaseEnv() {
  const url = readFirst(SUPABASE_URL_KEYS);
  const publishableKey = readFirst(SUPABASE_PUBLIC_KEY_KEYS);

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY for backward compatibility).",
    );
  }

  return { url, publishableKey };
}