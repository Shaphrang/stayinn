import Link from "next/link";
import { createOwnerAction, updateOwnerAction } from "./actions";

type ProfileOption = { id: string; full_name: string; email: string | null; phone: string | null };

type OwnerFormProps = {
  profiles: ProfileOption[];
  owner?: Record<string, string | null>;
};

export function OwnerForm({ profiles, owner }: OwnerFormProps) {
  const isEdit = Boolean(owner?.id);
  const action = isEdit ? updateOwnerAction : createOwnerAction;

  return <form action={action} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
    {isEdit ? <input type="hidden" name="id" value={owner?.id ?? ""} /> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm">Profile<select name="profile_id" defaultValue={owner?.profile_id ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" required>{profiles.map((p)=><option key={p.id} value={p.id}>{p.full_name} ({p.email ?? p.phone ?? p.id.slice(0,6)})</option>)}</select></label>
      <label className="text-sm">Status<select name="status" defaultValue={owner?.status ?? "pending"} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select></label>
      <label className="text-sm">Business Name<input name="business_name" defaultValue={owner?.business_name ?? ""} required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="text-sm">Owner Name<input name="contact_person" defaultValue={owner?.contact_person ?? ""} required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="text-sm">Phone<input name="phone" defaultValue={owner?.phone ?? ""} required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="text-sm">Email<input name="email" defaultValue={owner?.email ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
    </div>
    <label className="text-sm">Address<textarea name="address" defaultValue={owner?.address ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} /></label>
    <div className="flex gap-2"><button className="rounded-xl bg-slate-900 px-4 py-2 text-white">{isEdit ? "Update Owner" : "Create Owner"}</button><Link className="rounded-xl border px-4 py-2" href="/admin/owners">Cancel</Link></div>
  </form>;
}
