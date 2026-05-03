import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import {
  AdminBadge,
  AdminCard,
  AdminCardHeader,
  AdminPageHeader,
  StatCard,
} from "@/components/admin/stayinn-admin-ui";
import { supabaseCount, supabaseSelectPage } from "@/lib/supabase/server";

type RecentBooking = {
  id: string;
  booking_code: string;
  guest_full_name: string | null;
  property_name: string | null;
  room_name: string | null;
  check_in_date: string;
  check_out_date: string;
  status: string;
  payment_status: string;
  total_amount: number;
};

type TopProperty = {
  id: string;
  name: string;
  status: string;
  is_featured: boolean;
  location_name: string | null;
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function badgeTone(value: string) {
  if (["active", "approved", "confirmed", "paid"].includes(value)) {
    return "green" as const;
  }

  if (["pending", "pending_review", "partial", "draft"].includes(value)) {
    return "amber" as const;
  }

  if (["completed", "featured"].includes(value)) {
    return "violet" as const;
  }

  if (["rejected", "cancelled", "inactive", "unpaid"].includes(value)) {
    return "red" as const;
  }

  return "slate" as const;
}

export default async function AdminDashboardPage() {
  await requirePlatformAdmin();

  const [
    owners,
    properties,
    rooms,
    bookings,
    activeRooms,
    pendingProperties,
    recentBookings,
    topProperties,
  ] = await Promise.all([
    supabaseCount("owner_profiles"),
    supabaseCount("v_admin_properties"),
    supabaseCount("v_admin_rooms"),
    supabaseCount("v_admin_bookings"),
    supabaseCount("v_admin_rooms", "&status=eq.active"),
    supabaseCount("v_admin_properties", "&status=eq.pending_review"),
    supabaseSelectPage<RecentBooking>(
      "v_admin_bookings",
      [
        "id",
        "booking_code",
        "guest_full_name",
        "property_name",
        "room_name",
        "check_in_date",
        "check_out_date",
        "status",
        "payment_status",
        "total_amount",
      ].join(","),
      "&order=created_at.desc",
      {
        from: 0,
        to: 5,
      },
    ),
    supabaseSelectPage<TopProperty>(
      "v_admin_properties",
      "id,name,status,is_featured,location_name",
      "&order=created_at.desc",
      {
        from: 0,
        to: 4,
      },
    ),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Monitor business performance across the StayInn platform."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Owners"
          value={owners}
          hint="16% this month"
          icon="♙"
          tone="emerald"
        />
        <StatCard
          label="Total Properties"
          value={properties}
          hint="28% this month"
          icon="⌂"
          tone="blue"
        />
        <StatCard
          label="Active Rooms"
          value={activeRooms}
          hint="18% this month"
          icon="▱"
          tone="violet"
        />
        <StatCard
          label="Total Bookings"
          value={bookings}
          hint="22% this month"
          icon="▣"
          tone="amber"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value="₹0"
          hint="Connect payments"
          icon="₹"
          tone="emerald"
        />
        <StatCard
          label="Pending Reviews"
          value={pendingProperties}
          hint="Needs action"
          icon="☆"
          tone="violet"
        />
        <StatCard
          label="Occupancy Rate"
          value="--"
          hint="Coming soon"
          icon="◷"
          tone="cyan"
        />
        <StatCard
          label="Total Rooms"
          value={rooms}
          hint="All room records"
          icon="▤"
          tone="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <AdminCard>
          <AdminCardHeader
            title="Recent Bookings"
            description="Latest guest bookings across properties."
            actionHref="/admin/bookings"
            actionLabel="View all"
          />

          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Property</th>
                <th className="p-4">Check-in</th>
                <th className="p-4">Check-out</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Amount</th>
              </tr>
            </thead>

            <tbody>
              {recentBookings.data.length > 0 ? (
                recentBookings.data.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-100">
                    <td className="p-4 font-bold text-slate-900">
                      {booking.booking_code}
                    </td>
                    <td className="p-4">{booking.guest_full_name ?? "-"}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">
                        {booking.property_name ?? "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.room_name ?? "-"}
                      </p>
                    </td>
                    <td className="p-4">{formatDate(booking.check_in_date)}</td>
                    <td className="p-4">{formatDate(booking.check_out_date)}</td>
                    <td className="p-4">
                      <AdminBadge tone={badgeTone(booking.status)}>
                        {booking.status.replaceAll("_", " ")}
                      </AdminBadge>
                    </td>
                    <td className="p-4">
                      <AdminBadge tone={badgeTone(booking.payment_status)}>
                        {booking.payment_status.replaceAll("_", " ")}
                      </AdminBadge>
                    </td>
                    <td className="p-4 font-bold">
                      {formatCurrency(booking.total_amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <AdminCardHeader
              title="Top Properties"
              description="Recently added or promoted listings."
              actionHref="/admin/properties"
              actionLabel="View all"
            />

            <div className="divide-y divide-slate-100">
              {topProperties.data.length > 0 ? (
                topProperties.data.map((property, index) => (
                  <Link
                    key={property.id}
                    href={`/admin/properties/${property.id}`}
                    className="flex items-center gap-4 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-sm font-black text-cyan-700">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">
                        {property.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {property.location_name ?? "-"}
                      </p>
                    </div>
                    <AdminBadge tone={badgeTone(property.status)}>
                      {property.status.replaceAll("_", " ")}
                    </AdminBadge>
                  </Link>
                ))
              ) : (
                <p className="p-5 text-sm text-slate-500">
                  No properties found.
                </p>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Recent Activity" description="System updates." />

            <div className="space-y-3 p-5">
              {[
                "New property listing added",
                "Booking status updated",
                "Owner profile reviewed",
                "Room price changed",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item}
                    </p>
                    <p className="text-xs text-slate-500">
                      {index + 1} hour ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}