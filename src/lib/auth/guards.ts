import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseAuthUser, supabaseSelect } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const token = await getAdminSession();
  if (!token) redirect("/admin/login");

  const user = await supabaseAuthUser(token);
  if (!user?.id) redirect("/admin/login");

  const profiles = await supabaseSelect<{ role: string; is_active: boolean }>("profiles", "role,is_active", token, `&id=eq.${user.id}&limit=1`);
  const profile = profiles[0];
  if (!profile || profile.role !== "platform_admin" || profile.is_active !== true) redirect("/admin/login");

  return { token, user };
}
