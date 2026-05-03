import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { BookingForm } from "@/components/admin/booking-form";
import { createBooking } from "../actions";

type SearchParams = Record<string, string | string[] | undefined>;

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

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};
  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const [properties, rooms] = await Promise.all([
    supabaseSelectPage<PropertyOption>(
      "v_admin_properties",
      "id,name,owner_id,status,location_name,district_name,state_name",
      "&status=eq.active&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<RoomOption>(
      "property_rooms",
      "id,property_id,name,room_type,max_guests,weekday_rate,weekend_rate,status",
      "&status=eq.active&order=name.asc",
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
            Create Booking
          </h1>
          <p className="text-sm text-slate-500">
            Add a direct/admin booking for a guest.
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          Back to Bookings
        </Link>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <BookingForm
        properties={properties.data}
        rooms={rooms.data}
        action={createBooking}
      />
    </div>
  );
}