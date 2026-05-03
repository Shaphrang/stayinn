//src\app\admin\(panel)\bookings\[id]\page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import {
  cancelBooking,
  setBookingStatus,
  setPaymentStatus,
} from "../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded";

type BookingDetailRow = {
  id: string;
  booking_code: string;
  guest_id: string;
  property_id: string;
  room_id: string;
  owner_id: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  updated_at: string | null;
  guest_full_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  property_name: string | null;
  room_name: string | null;
  room_type: string | null;
  owner_business_name: string | null;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
};

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

function isPostgresUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getParam(params: SearchParams, key: string, fallback = "") {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
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

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-medium text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;

  if (!isPostgresUuid(id)) {
    return notFound();
  }

  const queryParams = (await searchParams) ?? {};
  const success = getParam(queryParams, "success");
  const error = getParam(queryParams, "error");

  const bookingResult = await supabaseSelectPage<BookingDetailRow>(
    "v_admin_bookings",
    [
      "id",
      "booking_code",
      "guest_id",
      "property_id",
      "room_id",
      "owner_id",
      "check_in_date",
      "check_out_date",
      "nights",
      "status",
      "payment_status",
      "total_amount",
      "created_at",
      "updated_at",
      "guest_full_name",
      "guest_phone",
      "guest_email",
      "property_name",
      "room_name",
      "room_type",
      "owner_business_name",
      "location_name",
      "district_name",
      "state_name",
    ].join(","),
    `&id=eq.${id}`,
    {
      from: 0,
      to: 0,
    },
  );

  const booking = bookingResult.data[0];

  if (!booking) {
    return notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Booking Detail
          </h1>
          <p className="text-sm text-slate-500">{booking.booking_code}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/bookings"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Back
          </Link>

          <Link
            href={`/admin/bookings/${booking.id}/edit`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Edit Booking
          </Link>
        </div>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {booking.guest_full_name}
            </h2>
            <p className="text-sm text-slate-500">
              {booking.property_name} · {booking.room_name}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
                booking.status,
              )}`}
            >
              {formatStatus(booking.status)}
            </span>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPaymentBadgeClass(
                booking.payment_status,
              )}`}
            >
              {formatPaymentStatus(booking.payment_status)}
            </span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Detail label="Booking Code" value={booking.booking_code} />
          <Detail label="Guest Name" value={booking.guest_full_name} />
          <Detail label="Guest Phone" value={booking.guest_phone} />
          <Detail label="Guest Email" value={booking.guest_email} />
          <Detail label="Property" value={booking.property_name} />
          <Detail label="Room" value={booking.room_name} />
          <Detail label="Owner" value={booking.owner_business_name} />
          <Detail label="Location" value={booking.location_name} />
          <Detail label="Check-in" value={formatDate(booking.check_in_date)} />
          <Detail label="Check-out" value={formatDate(booking.check_out_date)} />
          <Detail label="Nights" value={booking.nights} />
          <Detail label="Total Amount" value={formatCurrency(booking.total_amount)} />
          <Detail label="Created" value={formatDateTime(booking.created_at)} />
          <Detail label="Updated" value={formatDateTime(booking.updated_at)} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <form action={setBookingStatus} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={booking.id} />
            <input
              type="hidden"
              name="return_to"
              value={`/admin/bookings/${booking.id}`}
            />

            <select
              name="status"
              defaultValue={booking.status}
              className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save Status
            </button>
          </form>

          <form action={setPaymentStatus} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={booking.id} />
            <input
              type="hidden"
              name="return_to"
              value={`/admin/bookings/${booking.id}`}
            />

            <select
              name="payment_status"
              defaultValue={booking.payment_status}
              className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatPaymentStatus(status)}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save Payment
            </button>
          </form>

          <form action={cancelBooking}>
            <input type="hidden" name="id" value={booking.id} />
            <input
              type="hidden"
              name="return_to"
              value={`/admin/bookings/${booking.id}`}
            />

            <button
              type="submit"
              disabled={booking.status === "cancelled"}
              className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {booking.status === "cancelled" ? "Already Cancelled" : "Cancel Booking"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}