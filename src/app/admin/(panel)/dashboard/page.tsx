import { requirePlatformAdmin } from "@/lib/auth/guards";
import { fmtMoney, getTable } from "@/lib/admin-data";

export default async function Page() {
  await requirePlatformAdmin();

  const [owners, properties, rooms, bookings, payments] = await Promise.all([
    getTable("owner_profiles", "status"),
    getTable("properties", "status"),
    getTable("property_rooms", "id"),
    getTable("bookings", "status"),
    getTable("booking_payments", "amount,payment_status"),
  ]);

  const paid = payments
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const stats = [
    ["Total Owners", owners.length],
    ["Pending Owners", owners.filter((owner) => owner.status === "pending").length],
    ["Approved Owners", owners.filter((owner) => owner.status === "approved").length],
    ["Total Properties", properties.length],
    [
      "Active Properties",
      properties.filter((property) => property.status === "active").length,
    ],
    [
      "Pending Properties",
      properties.filter((property) => property.status === "pending").length,
    ],
    ["Total Rooms", rooms.length],
    ["Total Bookings", bookings.length],
    [
      "Pending Bookings",
      bookings.filter((booking) => booking.status === "pending").length,
    ],
    [
      "Confirmed Bookings",
      bookings.filter((booking) => booking.status === "confirmed").length,
    ],
    [
      "Completed Bookings",
      bookings.filter((booking) => booking.status === "completed").length,
    ],
    ["Collected", fmtMoney(paid)],
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={String(label)} className="rounded border bg-white p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-bold">{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}