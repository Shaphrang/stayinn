import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelect } from "@/lib/supabase/server";
import { OwnerForm } from "../../owner-form";

export default async function EditOwnerPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  const [owner] = await supabaseSelect<Record<string, string | null>>("owner_profiles", "id,profile_id,business_name,contact_person,phone,email,address,status", `&id=eq.${id}&limit=1`);
  if (!owner) return notFound();
  const profiles = await supabaseSelect<{ id: string; full_name: string; email: string | null; phone: string | null }>("profiles", "id,full_name,email,phone", "&role=eq.owner&order=created_at.desc");

  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Edit Owner</h1><OwnerForm profiles={profiles} owner={owner} /></div>;
}
