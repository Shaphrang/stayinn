import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseSelect } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  let profiles: { role: string; is_active: boolean }[] = [];
  try {
    profiles = await supabaseSelect<{ role: string; is_active: boolean }>(
      "profiles",
      "role,is_active",
      `&id=eq.${encodeURIComponent(session.userId)}&limit=1`,
      session.accessToken,
    );
  } catch {
    redirect("/admin/login");
  }
  const profile = profiles[0];
  if (!profile || profile.role !== "platform_admin" || profile.is_active !== true) redirect("/admin/login");

  return { userId: session.userId, accessToken: session.accessToken };
}
