import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { BookingForm } from "@/components/admin/booking-form";
import { updateBooking } from "../../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type BookingFormData = {
  id: string;
  guest_id: string;
  property_id: string;
  room_id: string;
  guest_full_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  check_in_date: string;
  check_out_date: string;
  status: string;
  payment_status: string;
  total_amount: number;
};

type PropertyOption = {
  id: string;
  name: string;
  owner_id: string;
  status: string;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
};

type RoomOption = {
  id: string;
  property_id: string;
  name: string;
  room_type: string;
  max_guests: number;
  weekday_rate: number;
  weekend_rate: number;
  status: string;
};

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

export default async function EditBookingPage({
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

  const bookingResult = await supabaseSelectPage<BookingFormData>(
    "v_admin_bookings",
    [
      "id",
      "guest_id",
      "property_id",
      "room_id",
      "guest_full_name",
      "guest_phone",
      "guest_email",
      "check_in_date",
      "check_out_date",
      "status",
      "payment_status",
      "total_amount",
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

  const [properties, rooms] = await Promise.all([
    supabaseSelectPage<PropertyOption>(
      "v_admin_properties",
      "id,name,owner_id,status,location_name,district_name,state_name",
      `&or=(status.eq.active,id.eq.${booking.property_id})&order=name.asc`,
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<RoomOption>(
      "property_rooms",
      "id,property_id,name,room_type,max_guests,weekday_rate,weekend_rate,status",
      `&or=(status.eq.active,id.eq.${booking.room_id})&order=name.asc`,
      {
        from: 0,
        to: 999,
      },
    ),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit Booking
          </h1>
          <p className="text-sm text-slate-500">
            Update guest, stay dates, room, status and payment information.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/bookings/${booking.id}`}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            View Booking
          </Link>

          <Link
            href="/admin/bookings"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Back to Bookings
          </Link>
        </div>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <BookingForm
        data={booking}
        properties={properties.data}
        rooms={rooms.data}
        action={updateBooking}
      />
    </div>
  );
}