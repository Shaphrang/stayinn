import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { markRoomInactive, setRoomStatus } from "../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type RoomStatus = "active" | "inactive" | "maintenance";

type RoomDetailRow = {
  id: string;
  property_id: string;
  name: string;
  room_type: string;
  max_guests: number;
  weekday_rate: number;
  weekend_rate: number;
  season_rate: number | null;
  holiday_rate: number | null;
  status: RoomStatus;
  created_at: string;
  property_name: string | null;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
};

const roomStatuses: RoomStatus[] = ["active", "inactive", "maintenance"];

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

function formatRoomType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatStatus(status: RoomStatus) {
  const labels: Record<RoomStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    maintenance: "Maintenance",
  };

  return labels[status];
}

function getStatusBadgeClass(status: RoomStatus) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "maintenance") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
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

export default async function RoomViewPage({
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

  const roomResult = await supabaseSelectPage<RoomDetailRow>(
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
      "status",
      "created_at",
      "property_name",
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

  const room = roomResult.data[0];

  if (!room) {
    return notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {room.name}
          </h1>
          <p className="text-sm text-slate-500">
            {room.property_name ?? "No property"} ·{" "}
            {[room.location_name, room.district_name].filter(Boolean).join(", ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/rooms"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Back
          </Link>

          <Link
            href={`/admin/rooms/${room.id}/edit`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Edit Room
          </Link>
        </div>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {room.name}
            </h2>
            <p className="text-sm text-slate-500">
              {formatRoomType(room.room_type)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
              room.status,
            )}`}
          >
            {formatStatus(room.status)}
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Detail label="Room Name" value={room.name} />
          <Detail label="Property" value={room.property_name} />
          <Detail label="Room Type" value={formatRoomType(room.room_type)} />
          <Detail label="Max Guests" value={room.max_guests} />
          <Detail label="Weekday Rate" value={formatCurrency(room.weekday_rate)} />
          <Detail label="Weekend Rate" value={formatCurrency(room.weekend_rate)} />
          <Detail label="Season Rate" value={formatCurrency(room.season_rate)} />
          <Detail label="Holiday Rate" value={formatCurrency(room.holiday_rate)} />
          <Detail label="Status" value={formatStatus(room.status)} />
          <Detail label="Created" value={formatDateTime(room.created_at)} />
          <Detail label="Location" value={room.location_name} />
          <Detail label="District" value={room.district_name} />
          <Detail label="State" value={room.state_name} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <form action={setRoomStatus} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={room.id} />
            <input
              type="hidden"
              name="return_to"
              value={`/admin/rooms/${room.id}`}
            />

            <select
              name="status"
              defaultValue={room.status}
              className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {roomStatuses.map((status) => (
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

          <form action={markRoomInactive}>
            <input type="hidden" name="id" value={room.id} />
            <input
              type="hidden"
              name="return_to"
              value={`/admin/rooms/${room.id}`}
            />

            <button
              type="submit"
              disabled={room.status === "inactive"}
              className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {room.status === "inactive" ? "Already Inactive" : "Mark Inactive"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}