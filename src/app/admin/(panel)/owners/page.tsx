import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getTable, fmtDate } from "@/lib/admin-data";
import { deleteOwnerAction, setOwnerStatusAction, updateOwnerBasicAction } from "./actions";

type OwnerRow = {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
};

export default async function Page({ searchParams }: { searchParams?: Promise<{ q?: string; status?: string }> }) {
  await requirePlatformAdmin();
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();
  const status = (params.status ?? "").trim().toLowerCase();

  const rows = await getTable(
    "owner_profiles",
    "id,business_name,contact_person,phone,email,status,created_at,address,remarks",
    "&order=created_at.desc",
  ) as OwnerRow[];

  const filtered = rows.filter((r) => {
    const searchable = [r.business_name, r.contact_person, r.phone, r.email].join(" ").toLowerCase();
    return (!q || searchable.includes(q)) && (!status || r.status === status);
  });

  return <div className="space-y-4">
    <h1 className='text-2xl font-semibold'>Owners</h1>
    <form className="flex gap-2">
      <input name="q" defaultValue={q} placeholder="Search" className="rounded border px-3 py-2" />
      <select name="status" defaultValue={status} className="rounded border px-3 py-2">
        <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option>
      </select>
      <button className="rounded bg-slate-800 px-4 py-2 text-white">Filter</button>
    </form>
    <div className='bg-white border rounded p-3 overflow-auto text-sm'>
      <table className="w-full min-w-[900px]"><thead><tr className="text-left"><th>Business</th><th>Contact</th><th>Phone</th><th>Email</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>
        {filtered.map((r) => <tr key={r.id} className="border-t align-top"><td>{r.business_name}</td><td>{r.contact_person}</td><td>{r.phone}</td><td>{r.email}</td><td>{r.status}</td><td>{fmtDate(r.created_at)}</td><td className="space-y-2 py-2">
          <form action={setOwnerStatusAction} className="flex gap-1"><input type="hidden" name="id" value={r.id} />
            <select name="status" defaultValue={r.status} className="rounded border px-2 py-1"><option value="approved">approved</option><option value="rejected">rejected</option><option value="suspended">suspended</option><option value="pending">pending</option></select>
            <input name="remarks" placeholder="remarks" className="rounded border px-2 py-1" />
            <button className="rounded bg-blue-700 px-2 py-1 text-white">Update</button>
          </form>
          <form action={updateOwnerBasicAction} className="grid grid-cols-2 gap-1"><input type="hidden" name="id" value={r.id} />
            <input name="business_name" defaultValue={r.business_name} className="rounded border px-2 py-1"/><input name="contact_person" defaultValue={r.contact_person} className="rounded border px-2 py-1"/>
            <input name="phone" defaultValue={r.phone} className="rounded border px-2 py-1"/><input name="email" defaultValue={r.email} className="rounded border px-2 py-1"/>
            <input name="address" defaultValue="" className="rounded border px-2 py-1"/><input name="remarks" defaultValue="" className="rounded border px-2 py-1"/>
            <button className="rounded bg-emerald-700 px-2 py-1 text-white col-span-2">Save Details</button>
          </form>
          <form action={deleteOwnerAction}><input type="hidden" name="id" value={r.id}/><button className="rounded bg-rose-700 px-2 py-1 text-white" formAction={deleteOwnerAction}>Delete</button></form>
        </td></tr>)}
      </tbody></table>
    </div>
  </div>;
}
