import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelect } from "@/lib/supabase/server";
import { OwnerForm } from "../owner-form";

export default async function NewOwnerPage() {
  await requirePlatformAdmin();
  const profiles = await supabaseSelect<{ id: string; full_name: string; email: string | null; phone: string | null }>("profiles", "id,full_name,email,phone", "&role=eq.owner&is_active=eq.true&order=created_at.desc");

  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Add Owner</h1><OwnerForm profiles={profiles} /></div>;
}
