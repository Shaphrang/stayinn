//src\app\admin\(panel)\bookings\page.tsx
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { supabaseSelectPage } from "@/lib/supabase/server";
import {
  cancelBooking,
  setBookingStatus,
  setPaymentStatus,
} from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded";

type BookingListRow = {
  id: string;
  booking_code: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  guest_full_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  property_name: string | null;
  property_cover_image: string | null;
  room_name: string | null;
  owner_business_name: string | null;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
};

type BookingStatsRow = {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  revenue: number;
};

type PropertyOption = {
  id: string;
  name: string;
};

const pageSizeOptions = [10, 20] as const;

const bookingStatuses: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
];

const paymentStatuses: PaymentStatus[] = [
  "unpaid",
  "paid",
  "partial",
  "refunded",
];

function getParam(params: SearchParams, key: string, fallback = "") {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function isBookingStatus(value: string): value is BookingStatus {
  return bookingStatuses.includes(value as BookingStatus);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return paymentStatuses.includes(value as PaymentStatus);
}

function formatStatus(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  return labels[status];
}

function formatPaymentStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    unpaid: "Unpaid",
    paid: "Paid",
    partial: "Partial",
    refunded: "Refunded",
  };

  return labels[status];
}

function getStatusBadgeClass(status: BookingStatus) {
  if (status === "confirmed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "completed") {
    return "bg-violet-50 text-violet-700 ring-violet-200";
  }

  if (status === "pending") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function getPaymentBadgeClass(status: PaymentStatus) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "partial") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (status === "refunded") {
    return "bg-violet-50 text-violet-700 ring-violet-200";
  }

  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function sanitizeSearch(value: string) {
  return value
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function buildBookingFilterQuery({
  q,
  checkInDate,
  checkOutDate,
  propertyId,
  status,
  paymentStatus,
}: {
  q: string;
  checkInDate: string;
  checkOutDate: string;
  propertyId: string;
  status: string;
  paymentStatus: string;
}) {
  const filters: string[] = [];

  if (checkInDate) {
    filters.push(`check_in_date=gte.${checkInDate}`);
  }

  if (checkOutDate) {
    filters.push(`check_out_date=lte.${checkOutDate}`);
  }

  if (propertyId) {
    filters.push(`property_id=eq.${propertyId}`);
  }

  if (status && isBookingStatus(status)) {
    filters.push(`status=eq.${status}`);
  }

  if (paymentStatus && isPaymentStatus(paymentStatus)) {
    filters.push(`payment_status=eq.${paymentStatus}`);
  }

  const search = sanitizeSearch(q);

  if (search) {
    const pattern = encodeURIComponent(`*${search}*`);

    filters.push(
      [
        "or=(",
        `booking_code.ilike.${pattern},`,
        `guest_full_name.ilike.${pattern},`,
        `guest_phone.ilike.${pattern},`,
        `guest_email.ilike.${pattern},`,
        `property_name.ilike.${pattern},`,
        `room_name.ilike.${pattern}`,
        ")",
      ].join(""),
    );
  }

  return filters.length ? `&${filters.join("&")}` : "";
}

function buildBookingsPageUrl(params: SearchParams, page: number) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  nextParams.set("page", String(page));

  return `/admin/bookings?${nextParams.toString()}`;
}

function buildCurrentBookingsUrl(params: SearchParams) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  const query = nextParams.toString();

  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMediaUrl(path?: string | null) {
  if (!path) return "";

  const trimmed = path.trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  const { url } = getSupabaseEnv();

  return `${url.replace(/\/$/, "")}/storage/v1/object/public/stayinn-media/${trimmed}`;
}

function MessageBox({
  type,
  message,
}: {
  type: "success" | "error";
  message?: string;
}) {
  if (!message) return null;

  const className =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${className}`}
    >
      {message}
    </div>
  );
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};

  const q = getParam(params, "q").trim();
  const checkInDate = getParam(params, "check_in_date").trim();
  const checkOutDate = getParam(params, "check_out_date").trim();
  const propertyId = getParam(params, "property_id").trim();

  const rawStatus = getParam(params, "status").trim();
  const rawPaymentStatus = getParam(params, "payment_status").trim();

  const status = isBookingStatus(rawStatus) ? rawStatus : "";
  const paymentStatus = isPaymentStatus(rawPaymentStatus)
    ? rawPaymentStatus
    : "";

  const requestedPage = Math.max(Number(getParam(params, "page", "1")) || 1, 1);
  const requestedPageSize = Number(getParam(params, "pageSize", "10"));

  const pageSize = pageSizeOptions.includes(
    requestedPageSize as (typeof pageSizeOptions)[number],
  )
    ? requestedPageSize
    : 10;

  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const filterQuery = buildBookingFilterQuery({
    q,
    checkInDate,
    checkOutDate,
    propertyId,
    status,
    paymentStatus,
  });

  const start = (requestedPage - 1) * pageSize;
  const end = start + pageSize - 1;

  const [bookingsResult, statsResult, propertiesResult] = await Promise.all([
    supabaseSelectPage<BookingListRow>(
      "v_admin_bookings",
      [
        "id",
        "booking_code",
        "check_in_date",
        "check_out_date",
        "nights",
        "status",
        "payment_status",
        "total_amount",
        "created_at",
        "guest_full_name",
        "guest_phone",
        "guest_email",
        "property_name",
        "property_cover_image",
        "room_name",
        "owner_business_name",
        "location_name",
        "district_name",
        "state_name",
      ].join(","),
      `${filterQuery}&order=created_at.desc`,
      {
        from: start,
        to: end,
      },
    ),

    supabaseSelectPage<BookingStatsRow>(
      "v_admin_booking_stats",
      "total_bookings,pending_bookings,confirmed_bookings,completed_bookings,revenue",
      "",
      {
        from: 0,
        to: 0,
      },
    ),

    supabaseSelectPage<PropertyOption>(
      "properties",
      "id,name",
      "&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),
  ]);

  const rows = bookingsResult.data;
  const total = bookingsResult.count;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const stats = statsResult.data[0] ?? {
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    completed_bookings: 0,
    revenue: 0,
  };

  const currentBookingsUrl = buildCurrentBookingsUrl(params);

  const summaryCards = [
    {
      label: "Total Bookings",
      value: stats.total_bookings,
      hint: "All booking records",
      icon: "▣",
      colorClass: "text-sky-600",
    },
    {
      label: "Pending",
      value: stats.pending_bookings,
      hint: "Awaiting confirmation",
      icon: "◷",
      colorClass: "text-amber-600",
    },
    {
      label: "Confirmed",
      value: stats.confirmed_bookings,
      hint: "Confirmed stays",
      icon: "✓",
      colorClass: "text-emerald-600",
    },
    {
      label: "Completed",
      value: stats.completed_bookings,
      hint: "Completed bookings",
      icon: "▣",
      colorClass: "text-violet-600",
    },
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue),
      hint: "Paid confirmed/completed",
      icon: "₹",
      colorClass: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
          <p className="text-slate-500">
            Manage and monitor all bookings across your properties.
          </p>
        </div>

        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
        >
          Add Booking
        </Link>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <div className="grid gap-4 md:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-2xl ${card.colorClass}`}
              >
                {card.icon}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {card.value}
                </p>
                <p className={`mt-1 text-xs font-medium ${card.colorClass}`}>
                  {card.hint}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <form className="grid gap-3 border-b p-4 md:grid-cols-7">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search bookings by code, guest or property..."
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600 md:col-span-2"
          />

          <input
            name="check_in_date"
            type="date"
            defaultValue={checkInDate}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          />

          <input
            name="check_out_date"
            type="date"
            defaultValue={checkOutDate}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          />

          <select
            name="property_id"
            defaultValue={propertyId}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Properties</option>
            {propertiesResult.data.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Status</option>
            {bookingStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>

          <select
            name="payment_status"
            defaultValue={paymentStatus}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Payment</option>
            {paymentStatuses.map((item) => (
              <option key={item} value={item}>
                {formatPaymentStatus(item)}
              </option>
            ))}
          </select>

          <div className="flex gap-2 md:col-span-7">
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
            >
              Filters
            </button>

            <Link
              href="/admin/bookings"
              className="rounded-xl border px-4 py-2 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="overflow-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Booking Code</th>
                <th className="p-3">Guest</th>
                <th className="p-3">Property</th>
                <th className="p-3">Room</th>
                <th className="p-3">Check-in</th>
                <th className="p-3">Check-out</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Total</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((booking) => {
                  const imageUrl = getMediaUrl(booking.property_cover_image);

                  return (
                    <tr key={booking.id} className="border-t align-middle">
                      <td className="p-3 font-semibold text-slate-900">
                        {booking.booking_code}
                      </td>

                      <td className="p-3">
                        <p className="font-medium text-slate-900">
                          {booking.guest_full_name ?? "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.guest_email || booking.guest_phone || "-"}
                        </p>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={booking.property_name ?? "Property"}
                              className="h-12 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500">
                              No Image
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-slate-900">
                              {booking.property_name ?? "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {[booking.location_name, booking.district_name]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">{booking.room_name ?? "-"}</td>

                      <td className="p-3">{formatDate(booking.check_in_date)}</td>

                      <td className="p-3">
                        {formatDate(booking.check_out_date)}
                      </td>

                      <td className="p-3">
                        <form action={setBookingStatus} className="space-y-2">
                          <input type="hidden" name="id" value={booking.id} />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentBookingsUrl}
                          />

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
                              booking.status,
                            )}`}
                          >
                            {formatStatus(booking.status)}
                          </span>

                          <div className="flex gap-2">
                            <select
                              name="status"
                              defaultValue={booking.status}
                              className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-cyan-600"
                            >
                              {bookingStatuses.map((item) => (
                                <option key={item} value={item}>
                                  {formatStatus(item)}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      </td>

                      <td className="p-3">
                        <form action={setPaymentStatus} className="space-y-2">
                          <input type="hidden" name="id" value={booking.id} />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentBookingsUrl}
                          />

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPaymentBadgeClass(
                              booking.payment_status,
                            )}`}
                          >
                            {formatPaymentStatus(booking.payment_status)}
                          </span>

                          <div className="flex gap-2">
                            <select
                              name="payment_status"
                              defaultValue={booking.payment_status}
                              className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-cyan-600"
                            >
                              {paymentStatuses.map((item) => (
                                <option key={item} value={item}>
                                  {formatPaymentStatus(item)}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      </td>

                      <td className="p-3 font-semibold">
                        {formatCurrency(booking.total_amount)}
                      </td>

                      <td className="p-3">{formatDateTime(booking.created_at)}</td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            View
                          </Link>

                          <Link
                            href={`/admin/bookings/${booking.id}/edit`}
                            className="font-medium text-indigo-700 hover:underline"
                          >
                            Edit
                          </Link>

                          <form action={cancelBooking}>
                            <input type="hidden" name="id" value={booking.id} />
                            <input
                              type="hidden"
                              name="return_to"
                              value={currentBookingsUrl}
                            />

                            <button
                              type="submit"
                              className="font-medium text-rose-700 hover:underline"
                            >
                              Cancel
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="p-8 text-center text-slate-500"
                  >
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Showing {rows.length ? start + 1 : 0} to{" "}
            {Math.min(start + pageSize, total)} of {total} bookings
          </p>

          <div className="flex gap-2">
            {requestedPage > 1 ? (
              <Link
                className="rounded-lg border px-3 py-1 transition hover:bg-slate-50"
                href={buildBookingsPageUrl(params, requestedPage - 1)}
              >
                Prev
              </Link>
            ) : null}

            <span className="rounded-lg bg-cyan-700 px-3 py-1 text-white">
              {requestedPage}
            </span>

            {requestedPage < totalPages ? (
              <Link
                className="rounded-lg border px-3 py-1 transition hover:bg-slate-50"
                href={buildBookingsPageUrl(params, requestedPage + 1)}
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}