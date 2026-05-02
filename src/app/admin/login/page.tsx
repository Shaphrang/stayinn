import { redirect } from "next/navigation";
import { loginWithPassword } from "@/lib/supabase/client";
import { supabaseSelect } from "@/lib/supabase/server";
import { setAdminSession, clearAdminSession } from "@/lib/auth/session";

async function doLogin(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const res = await loginWithPassword(email, password);
  if (!res.ok) redirect("/admin/login?error=Invalid credentials");
  const data = await res.json();
  const userId = data.user?.id as string;
  await setAdminSession(userId);
  const byId = await supabaseSelect<{ role: string; is_active: boolean }>("profiles", "role,is_active", `&id=eq.${userId}&limit=1`);
  const p = byId.length
    ? byId
    : await supabaseSelect<{ role: string; is_active: boolean }>("profiles", "role,is_active", `&user_id=eq.${userId}&limit=1`);
  if (!p[0] || p[0].role !== "platform_admin" || p[0].is_active !== true) {
    await clearAdminSession();
    redirect("/admin/login?error=Your user is authenticated but is not an active platform_admin in profiles");
  }
  redirect("/admin/dashboard");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <form action={doLogin} className="w-full max-w-md bg-white p-6 rounded-xl border space-y-4">
    <h1 className="text-xl font-semibold">Admin Login</h1>
    {error && <p className="text-sm text-red-600">{error}</p>}
    <input name="email" type="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
    <input name="password" type="password" placeholder="Password" className="w-full border rounded px-3 py-2" required />
    <button className="w-full bg-slate-900 text-white rounded py-2">Sign in</button>
  </form>;
}
