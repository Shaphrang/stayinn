import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getTable, fmtDate } from "@/lib/admin-data";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string,string>> }) {
  await requirePlatformAdmin();
  const p = (await searchParams) ?? {};
  const rows = await getTable("properties", "id,cover_image,name,property_type,status,is_verified,is_featured,created_at,owner_profiles(business_name),states(name),districts(name),locations(name)", "&order=created_at.desc");
  const f = (rows  as Record<string, unknown>[]).filter((r)=> (!p.q || r.name?.toLowerCase().includes(p.q.toLowerCase())) && (!p.status || r.status===p.status) && (!p.property_type || r.property_type===p.property_type) && (!p.owner || r.owner_profiles?.business_name===p.owner) && (!p.location || r.locations?.name===p.location));
  return <div className="space-y-4"><div className="flex justify-between"><h1 className="text-2xl font-semibold">Properties</h1><Link href="/admin/properties/new" className="rounded bg-indigo-700 text-white px-4 py-2">New Property</Link></div>
  <form className="grid md:grid-cols-5 gap-2"><input name="q" placeholder="Search name" className="rounded border px-3 py-2"/><input name="owner" placeholder="Owner" className="rounded border px-3 py-2"/><input name="location" placeholder="Location" className="rounded border px-3 py-2"/><input name="status" placeholder="Status" className="rounded border px-3 py-2"/><input name="property_type" placeholder="Type" className="rounded border px-3 py-2"/></form>
  <div className="overflow-auto rounded-xl border bg-white"><table className="w-full min-w-[1200px] text-sm"><thead><tr className="text-left bg-slate-50"><th>Cover</th><th>Name</th><th>Type</th><th>Owner</th><th>State</th><th>District</th><th>Location</th><th>Status</th><th>Verified</th><th>Featured</th><th>Created</th><th>Actions</th></tr></thead><tbody>{f.map((r)=><tr key={r.id} className="border-t"><td>{r.cover_image?<img src={r.cover_image} className="h-12 w-16 object-cover rounded" alt={r.name}/>:"-"}</td><td>{r.name}</td><td>{r.property_type}</td><td>{r.owner_profiles?.business_name ?? "-"}</td><td>{r.states?.name ?? "-"}</td><td>{r.districts?.name ?? "-"}</td><td>{r.locations?.name ?? "-"}</td><td><StatusBadge value={r.status}/></td><td>{r.is_verified?"Yes":"No"}</td><td>{r.is_featured?"Yes":"No"}</td><td>{fmtDate(r.created_at)}</td><td><Link className="text-indigo-700" href={`/admin/properties/${r.id}`}>View</Link> · <Link className="text-indigo-700" href={`/admin/properties/${r.id}/edit`}>Edit</Link></td></tr>)}</tbody></table></div></div>
}
