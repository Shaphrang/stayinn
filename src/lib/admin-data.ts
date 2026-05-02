import { supabaseSelect } from "@/lib/supabase/server";

export const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : "-";
export const fmtMoney = (n?: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n ?? 0);

export async function getTable(table: string, select: string, extra = "") {
  return supabaseSelect<Record<string, unknown>>(table, select, extra);
}
