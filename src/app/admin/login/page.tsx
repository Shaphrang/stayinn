import { redirect } from "next/navigation";
import { loginWithPassword } from "@/lib/supabase/client";
import { supabaseSelect } from "@/lib/supabase/server";
import { setAdminSession, clearAdminSession } from "@/lib/auth/session";

type PasswordLoginResponse = {
  access_token?: string;
  expires_in?: number;
  user?: {
    id?: string;
  };
};

type AdminProfile = {
  role: string;
  is_active: boolean;
};

function loginErrorUrl(error: string) {
  return `/admin/login?${new URLSearchParams({ error }).toString()}`;
}

async function doLogin(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect(loginErrorUrl("Email and password are required."));

  let res: Response;
  try {
    res = await loginWithPassword(email, password);
  } catch {
    redirect(loginErrorUrl("Login service is temporarily unavailable. Please try again."));
  }

  if (!res.ok) redirect(loginErrorUrl("Invalid credentials."));

  let data: PasswordLoginResponse;
  try {
    data = await res.json();
  } catch {
    redirect(loginErrorUrl("Login service returned an invalid response. Please try again."));
  }

  const userId = data.user?.id;
  const accessToken = data.access_token;
  if (!userId || !accessToken) redirect(loginErrorUrl("Login service returned an incomplete session. Please try again."));

  let profiles: AdminProfile[] = [];
  try {
    profiles = await supabaseSelect<AdminProfile>(
      "profiles",
      "role,is_active",
      `&id=eq.${encodeURIComponent(userId)}&limit=1`,
      accessToken,
    );
  } catch {
    await clearAdminSession();
    redirect(loginErrorUrl("Unable to verify admin access right now. Please try again."));
  }

  if (!profiles[0] || profiles[0].role !== "platform_admin" || profiles[0].is_active !== true) {
    await clearAdminSession();
    redirect(loginErrorUrl("Your user is authenticated but is not an active platform_admin in profiles."));
  }

  await setAdminSession(userId, accessToken, data.expires_in);
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
