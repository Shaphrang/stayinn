import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getTable, fmtMoney } from "@/lib/admin-data";

export default async function Page() {
  const { token } = await requirePlatformAdmin();
  const [owners, props, rooms, bookings, payments] = await Promise.all([
    getTable("owner_profiles","status",token), getTable("properties","status",token), getTable("property_rooms","id",token), getTable("bookings","status",token), getTable("booking_payments","amount,payment_status",token)
  ]);
  const paid = payments.filter((p)=>p.payment_status==="paid").reduce((s,p)=>s+Number(p.amount||0),0);
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Dashboard</h1><div className="grid md:grid-cols-4 gap-3">{[
    ["Total Owners", owners.length],["Pending Owners", owners.filter(o=>o.status==="pending").length],["Approved Owners", owners.filter(o=>o.status==="approved").length],["Total Properties",props.length],
    ["Active Properties",props.filter(o=>o.status==="active").length],["Pending Properties",props.filter(o=>o.status==="pending").length],["Total Rooms",rooms.length],["Total Bookings",bookings.length],
    ["Pending Bookings",bookings.filter(o=>o.status==="pending").length],["Confirmed Bookings",bookings.filter(o=>o.status==="confirmed").length],["Completed Bookings",bookings.filter(o=>o.status==="completed").length],["Collected",fmtMoney(paid)]
  ].map(([k,v])=><div key={String(k)} className="bg-white border rounded p-3"><div className="text-xs text-slate-500">{k}</div><div className="text-xl font-bold">{String(v)}</div></div>)}</div></div>;
}
