import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelect } from "@/lib/supabase/server";
import { setOwnerStatusAction, markOwnerInactiveAction } from "./actions";

type OwnerListRow = {
  id: string; profile_id: string; business_name: string; contact_person: string | null; phone: string; email: string | null; status: string; created_at: string;
  profiles: { full_name: string | null; email: string | null; is_active: boolean } | null;
};

const pageSizeOptions = [10, 20];

export default async function OwnersPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  await requirePlatformAdmin();
  const p = (await searchParams) ?? {};
  const q = (p.q ?? "").trim().toLowerCase();
  const status = (p.status ?? "").trim().toLowerCase();
  const page = Math.max(Number(p.page ?? 1) || 1, 1);
  const pageSize = pageSizeOptions.includes(Number(p.pageSize)) ? Number(p.pageSize) : 10;

  const allOwners = await supabaseSelect<OwnerListRow>("owner_profiles", "id,profile_id,business_name,contact_person,phone,email,status,created_at,profiles:profile_id(full_name,email,is_active)", "&order=created_at.desc");
  const filtered = allOwners.filter((r) => {
    const searchable = [r.business_name, r.contact_person ?? "", r.phone, r.email ?? "", r.profiles?.email ?? "", r.profiles?.full_name ?? ""].join(" ").toLowerCase();
    if (q && !searchable.includes(q)) return false;
    if (status && r.status !== status) return false;
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const summary = {
    total: allOwners.length,
    approved: allOwners.filter((r) => r.status === "approved").length,
    pending: allOwners.filter((r) => r.status === "pending").length,
    inactive: allOwners.filter((r) => !r.profiles?.is_active || r.status === "suspended").length,
  };

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-slate-900">Owners</h1><p className="text-slate-500">Manage property owners and account status.</p></div><Link href="/admin/owners/new" className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white">Add Owner</Link></div>

    <div className="grid gap-4 md:grid-cols-4">{[
      ["Total Owners", summary.total, "text-sky-600"],
      ["Approved Owners", summary.approved, "text-emerald-600"],
      ["Pending Owners", summary.pending, "text-amber-600"],
      ["Inactive Owners", summary.inactive, "text-rose-600"],
    ].map(([label, value, color]) => <div key={label as string} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label as string}</p><p className={`mt-2 text-3xl font-bold ${color as string}`}>{value as number}</p></div>)}</div>

    <form className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-6">
      <input name="q" defaultValue={q} placeholder="Search business, owner, phone, email" className="rounded-xl border px-3 py-2 md:col-span-3" />
      <select name="status" defaultValue={status} className="rounded-xl border px-3 py-2"><option value="">All Statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select>
      <select name="pageSize" defaultValue={String(pageSize)} className="rounded-xl border px-3 py-2">{pageSizeOptions.map((s)=><option key={s} value={s}>{s} / page</option>)}</select>
      <div className="flex gap-2"><button className="rounded-xl bg-slate-900 px-4 py-2 text-white">Apply</button><Link href="/admin/owners" className="rounded-xl border px-4 py-2">Clear</Link></div>
    </form>

    <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[1100px] text-sm">
        <thead className="bg-slate-50 text-left text-slate-700"><tr><th className="p-3">Business</th><th className="p-3">Owner</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Created</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.length ? rows.map((r)=><tr key={r.id} className="border-t align-top"><td className="p-3 font-semibold">{r.business_name}</td><td className="p-3">{r.contact_person || r.profiles?.full_name || "-"}</td><td className="p-3">{r.phone}</td><td className="p-3">{r.email || r.profiles?.email || "-"}</td><td className="p-3"><form action={setOwnerStatusAction}><input type="hidden" name="id" value={r.id}/><select name="status" defaultValue={r.status} className="rounded-lg border px-2 py-1"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select><button className="ml-2 rounded bg-slate-100 px-2 py-1">Save</button></form></td><td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td><td className="p-3"><div className="flex gap-2"><Link href={`/admin/owners/${r.id}`} className="text-blue-700">View</Link><Link href={`/admin/owners/${r.id}/edit`} className="text-indigo-700">Edit</Link><form action={markOwnerInactiveAction} onSubmit={undefined}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="profile_id" value={r.profile_id}/><button className="text-rose-700" formAction={markOwnerInactiveAction}>Mark Inactive</button></form></div></td></tr>) : <tr><td colSpan={7} className="p-8 text-center text-slate-500">No owners found.</td></tr>}</tbody>
      </table>
    </div>

    <div className="flex items-center justify-between"><p className="text-sm text-slate-600">Showing {rows.length ? start + 1 : 0} to {Math.min(start + pageSize, total)} of {total} owners</p><div className="flex gap-2">{page > 1 ? <Link className="rounded-lg border px-3 py-1" href={`/admin/owners?${new URLSearchParams({ ...p, page: String(page - 1) }).toString()}`}>Prev</Link> : null}<span className="rounded-lg bg-slate-900 px-3 py-1 text-white">{page}</span>{page < totalPages ? <Link className="rounded-lg border px-3 py-1" href={`/admin/owners?${new URLSearchParams({ ...p, page: String(page + 1) }).toString()}`}>Next</Link> : null}</div></div>
  </div>;
}
