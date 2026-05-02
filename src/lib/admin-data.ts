import { supabaseSelect } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/session";

export const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : "-";
export const fmtMoney = (n?: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n ?? 0);

export async function getTable(table: string, select: string, extra = "") {
  const session = await getAdminSession();
  return supabaseSelect<Record<string, unknown>>(table, select, extra, session?.accessToken);
}
