import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { RoomForm } from "@/components/admin/room-form";
import { updateRoom } from "../../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type RoomFormData = {
  id: string;
  property_id: string;
  name: string;
  room_type: string;
  max_guests: number;
  weekday_rate: number;
  weekend_rate: number;
  season_rate: number | null;
  holiday_rate: number | null;
  cover_image: string | null;
  gallery_images: string[] | null;
  status: string;
};

type PropertyOption = {
  id: string;
  name: string;
  status: string;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
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

export default async function EditRoomPage({
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

  const roomResult = await supabaseSelectPage<RoomFormData>(
    "v_admin_rooms",
    [
      "id",
      "property_id",
      "name",
      "room_type",
      "max_guests",
      "weekday_rate",
      "weekend_rate",
      "season_rate",
      "holiday_rate",
      "cover_image",
      "gallery_images",
      "status",
    ].join(","),
    `&id=eq.${id}`,
    {
      from: 0,
      to: 0,
    },
  );

  const room = roomResult.data[0];

  if (!room) {
    return notFound();
  }

  const propertiesResult = await supabaseSelectPage<PropertyOption>(
    "v_admin_properties",
    "id,name,status,location_name,district_name,state_name",
    `&or=(status.eq.active,id.eq.${room.property_id})&order=name.asc`,
    {
      from: 0,
      to: 999,
    },
  );

  const hasCurrentProperty = propertiesResult.data.some(
    (property) => property.id === room.property_id,
  );

  const properties = hasCurrentProperty
    ? propertiesResult.data
    : [
        {
          id: room.property_id,
          name: "Current property",
          status: "active",
          location_name: null,
          district_name: null,
          state_name: null,
        },
        ...propertiesResult.data,
      ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Edit Room</h1>
          <p className="text-sm text-slate-500">
            Update room details, rates, capacity and status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/rooms/${room.id}`}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            View Room
          </Link>

          <Link
            href="/admin/rooms"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Back to Rooms
          </Link>
        </div>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <RoomForm properties={properties} data={room} action={updateRoom} />
    </div>
  );
}