import { requirePlatformAdmin } from "@/lib/auth/guards";
import { fmtMoney, getTable } from "@/lib/admin-data";

type StatusTone = "green" | "amber" | "red" | "slate" | "blue";

const toneClasses: Record<StatusTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default async function Page() {
  await requirePlatformAdmin();

  const [owners, properties, rooms, bookings, payments] = await Promise.all([
    getTable("owner_profiles", "id,status,created_at"),
    getTable("properties", "id,name,status,created_at"),
    getTable("property_rooms", "id"),
    getTable(
      "bookings",
      "id,booking_code,status,created_at,check_in_date,check_out_date,total_amount",
    ),
    getTable("booking_payments", "amount,payment_status"),
  ]);

  const paid = payments
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const statCards = [
    {
      label: "Total Owners",
      value: owners.length,
      tone: "blue" as const,
    },
    {
      label: "Pending Owners",
      value: owners.filter((owner) => owner.status === "pending").length,
      tone: "amber" as const,
    },
    {
      label: "Approved Owners",
      value: owners.filter((owner) => owner.status === "approved").length,
      tone: "green" as const,
    },
    {
      label: "Total Properties",
      value: properties.length,
      tone: "blue" as const,
    },
    {
      label: "Active Properties",
      value: properties.filter((property) => property.status === "active").length,
      tone: "green" as const,
    },
    {
      label: "Pending Properties",
      value: properties.filter((property) => property.status === "pending_review").length,
      tone: "amber" as const,
    },
    {
      label: "Total Rooms",
      value: rooms.length,
      tone: "slate" as const,
    },
    {
      label: "Total Bookings",
      value: bookings.length,
      tone: "blue" as const,
    },
    {
      label: "Pending Bookings",
      value: bookings.filter((booking) => booking.status === "pending").length,
      tone: "amber" as const,
    },
    {
      label: "Confirmed Bookings",
      value: bookings.filter((booking) => booking.status === "confirmed").length,
      tone: "green" as const,
    },
    {
      label: "Completed Bookings",
      value: bookings.filter((booking) => booking.status === "completed").length,
      tone: "green" as const,
    },
    {
      label: "Collected Revenue",
      value: fmtMoney(paid),
      tone: "green" as const,
    },
  ];

  const recentBookings = [...bookings]
    .sort((a, b) => {
      return +new Date(b.created_at) - +new Date(a.created_at);
    })
    .slice(0, 5);

  const recentProperties = [...properties]
    .sort((a, b) => {
      return +new Date(b.created_at) - +new Date(a.created_at);
    })
    .slice(0, 5);

  const pendingApprovals = [
    ...owners
      .filter((owner) => owner.status === "pending")
      .map((owner) => ({
        type: "Owner",
        created_at: owner.created_at,
      })),
    ...properties
      .filter((property) => property.status === "pending_review")
      .map((property) => ({
        type: "Property",
        created_at: property.created_at,
      })),
  ]
    .sort((a, b) => {
      return +new Date(b.created_at) - +new Date(a.created_at);
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[card.tone]}`}
              >
                {card.label}
              </span>
            </div>

            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {String(card.value)}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Bookings
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Check In / Out</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.length ? (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {booking.booking_code || `#${booking.id.slice(0, 8)}`}
                      </td>

                      <td className="px-5 py-3 text-slate-600">
                        {booking.check_in_date || "-"} →{" "}
                        {booking.check_out_date || "-"}
                      </td>

                      <td className="px-5 py-3 text-slate-900">
                        {fmtMoney(Number(booking.total_amount || 0))}
                      </td>

                      <td className="px-5 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-6 text-center text-slate-500"
                    >
                      No recent bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Properties
            </h2>
          </div>

          <ul className="space-y-3 p-4">
            {recentProperties.length ? (
              recentProperties.map((property) => (
                <li
                  key={property.id}
                  className="rounded-2xl border border-slate-100 p-3"
                >
                  <p className="font-medium text-slate-800">
                    {property.name || `Property #${property.id.slice(0, 6)}`}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={property.status} />

                    <span className="text-xs text-slate-500">
                      {new Date(property.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-slate-100 p-3 text-slate-500">
                No properties found.
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Pending Approvals
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pendingApprovals.length ? (
            pendingApprovals.map((item, index) => (
              <div
                key={`${item.type}-${index}`}
                className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3"
              >
                <p className="text-sm font-semibold text-amber-800">
                  {item.type} Approval Pending
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  Requested on{" "}
                  {new Date(item.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No pending approvals right now.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const value = status || "unknown";

  const tone: StatusTone =
    value === "approved" ||
    value === "active" ||
    value === "confirmed" ||
    value === "completed"
      ? "green"
      : value === "pending" || value === "pending_review"
        ? "amber"
        : value === "rejected" || value === "cancelled" || value === "suspended"
          ? "red"
          : "slate";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${toneClasses[tone]}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}