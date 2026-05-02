import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getTable, fmtDate } from "@/lib/admin-data";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function Page({ params }: { params: Promise<{id:string}> }) {
  await requirePlatformAdmin(); const {id}=await params;
  const rows = await getTable("properties", "*,owner_profiles(business_name),states(name),districts(name),locations(name)", `&id=eq.${id}&limit=1`);
  const p=(rows  as Record<string, unknown>[])[0]; if(!p) return <div>Property not found or you do not have access.</div>;
  return <div className="space-y-4"><div className="flex justify-between"><h1 className="text-2xl font-semibold">{p.name}</h1><Link href={`/admin/properties/${id}/edit`} className="rounded bg-indigo-700 text-white px-4 py-2">Edit</Link></div>
  <div className="rounded-xl border bg-white p-4 grid md:grid-cols-2 gap-3 text-sm"><div>Owner: {p.owner_profiles?.business_name}</div><div>Type: {p.property_type}</div><div>Status: <StatusBadge value={p.status} /></div><div>Verified: {p.is_verified?"Yes":"No"}</div><div>Featured: {p.is_featured?"Yes":"No"}</div><div>Created: {fmtDate(p.created_at)}</div><div>State: {p.states?.name}</div><div>District: {p.districts?.name}</div><div>Location: {p.locations?.name}</div><div>Phone: {p.contact_phone}</div><div>Email: {p.contact_email || "-"}</div><div>Whatsapp: {p.whatsapp_number||"-"}</div><div className="md:col-span-2">Address: {p.address}</div><div className="md:col-span-2">Short: {p.short_description}</div><div className="md:col-span-2">Description: {p.description}</div></div>
  </div>
}
