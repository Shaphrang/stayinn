import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelect } from "@/lib/supabase/server";
import { markOwnerInactiveAction } from "../actions";

export default async function OwnerViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  const [owner] = await supabaseSelect<Record<string, string | null>>("owner_profiles", "id,profile_id,business_name,contact_person,phone,email,address,status,remarks,created_at,updated_at", `&id=eq.${id}&limit=1`);
  if (!owner) return notFound();
  const [profile] = await supabaseSelect<{ is_active: boolean }>("profiles", "is_active", `&id=eq.${owner.profile_id}&limit=1`);

  return <div className="space-y-5">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Owner Details</h1><div className="flex gap-2"><Link href="/admin/owners" className="rounded-xl border px-3 py-2">Back</Link><Link href={`/admin/owners/${id}/edit`} className="rounded-xl bg-slate-900 px-3 py-2 text-white">Edit Owner</Link></div></div>
    <div className="grid gap-4 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-2">
      <Detail label="Business Name" value={owner.business_name} />
      <Detail label="Owner Name" value={owner.contact_person} />
      <Detail label="Phone" value={owner.phone} />
      <Detail label="Email" value={owner.email} />
      <Detail label="Status" value={owner.status} />
      <Detail label="Account Active" value={profile?.is_active ? "Yes" : "No"} />
      <Detail label="Address" value={owner.address} />
      <Detail label="Remarks" value={owner.remarks} />
      <Detail label="Created" value={owner.created_at ? new Date(owner.created_at).toLocaleString() : "-"} />
      <Detail label="Updated" value={owner.updated_at ? new Date(owner.updated_at).toLocaleString() : "-"} />
    </div>
    <form action={markOwnerInactiveAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="profile_id" value={owner.profile_id ?? ""} /><button className="rounded-xl bg-rose-700 px-4 py-2 text-white">Mark Inactive</button></form>
  </div>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="text-base font-medium text-slate-900">{value || "-"}</p></div>;
}
