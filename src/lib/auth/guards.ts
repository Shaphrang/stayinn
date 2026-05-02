import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseSelect } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const userId = await getAdminSession();
  if (!userId) redirect("/admin/login");

    let profiles: { role: string; is_active: boolean }[] = [];
  try {
    const profilesById = await supabaseSelect<{ role: string; is_active: boolean }>("profiles", "role,is_active", `&id=eq.${userId}&limit=1`);
    profiles = profilesById.length
      ? profilesById
      : await supabaseSelect<{ role: string; is_active: boolean }>("profiles", "role,is_active", `&user_id=eq.${userId}&limit=1`);
  } catch {
    redirect("/admin/login");
  }
  const profile = profiles[0];
  if (!profile || profile.role !== "platform_admin" || profile.is_active !== true) redirect("/admin/login");

  return { userId };
}
