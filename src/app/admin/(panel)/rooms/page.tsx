//src\app\admin\(panel)\rooms\page.tsx
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import {
  supabaseSelectPage,
} from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { markRoomInactive, setRoomStatus } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

type RoomStatus = "active" | "inactive" | "maintenance";

type RoomListRow = {
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
  property_cover_image: string | null;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
};

type RoomStatsRow = {
  total_rooms: number;
  active_rooms: number;
  premium_rooms: number;
  avg_nightly_rate: number;
};

type PropertyOption = {
  id: string;
  name: string;
};

const pageSizeOptions = [10, 20] as const;

const roomStatuses: RoomStatus[] = ["active", "inactive", "maintenance"];

const roomTypes = [
  "suite",
  "premium_room",
  "deluxe_room",
  "standard_room",
  "studio",
  "cabin",
  "apartment",
  "entire_villa",
  "room",
  "other",
];

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

function isRoomStatus(value: string): value is RoomStatus {
  return roomStatuses.includes(value as RoomStatus);
}

function sanitizeSearch(value: string) {
  return value
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function buildRoomFilterQuery({
  q,
  propertyId,
  roomType,
  status,
}: {
  q: string;
  propertyId: string;
  roomType: string;
  status: string;
}) {
  const filters: string[] = [];

  if (propertyId) {
    filters.push(`property_id=eq.${propertyId}`);
  }

  if (roomType) {
    filters.push(`room_type=eq.${encodeURIComponent(roomType)}`);
  }

  if (status && isRoomStatus(status)) {
    filters.push(`status=eq.${status}`);
  }

  const search = sanitizeSearch(q);

  if (search) {
    const pattern = encodeURIComponent(`*${search}*`);

    filters.push(
      [
        "or=(",
        `name.ilike.${pattern},`,
        `room_type.ilike.${pattern},`,
        `property_name.ilike.${pattern},`,
        `location_name.ilike.${pattern},`,
        `district_name.ilike.${pattern},`,
        `state_name.ilike.${pattern}`,
        ")",
      ].join(""),
    );
  }

  return filters.length ? `&${filters.join("&")}` : "";
}

function buildRoomsPageUrl(params: SearchParams, page: number) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  nextParams.set("page", String(page));

  return `/admin/rooms?${nextParams.toString()}`;
}

function buildCurrentRoomsUrl(params: SearchParams) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  const query = nextParams.toString();

  return query ? `/admin/rooms?${query}` : "/admin/rooms";
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

export default async function RoomsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};

  const q = getParam(params, "q").trim();
  const propertyId = getParam(params, "property_id").trim();
  const roomType = getParam(params, "room_type").trim();
  const rawStatus = getParam(params, "status").trim();
  const status = isRoomStatus(rawStatus) ? rawStatus : "";

  const requestedPage = Math.max(Number(getParam(params, "page", "1")) || 1, 1);
  const requestedPageSize = Number(getParam(params, "pageSize", "10"));
  const pageSize = pageSizeOptions.includes(
    requestedPageSize as (typeof pageSizeOptions)[number],
  )
    ? requestedPageSize
    : 10;

  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const filterQuery = buildRoomFilterQuery({
    q,
    propertyId,
    roomType,
    status,
  });

  const start = (requestedPage - 1) * pageSize;
  const end = start + pageSize - 1;

  const [roomsResult, statsResult, propertiesResult] = await Promise.all([
    supabaseSelectPage<RoomListRow>(
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
        "property_cover_image",
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

    supabaseSelectPage<RoomStatsRow>(
      "v_admin_room_stats",
      "total_rooms,active_rooms,premium_rooms,avg_nightly_rate",
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

  const rows = roomsResult.data;
  const total = roomsResult.count;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const stats = statsResult.data[0] ?? {
    total_rooms: 0,
    active_rooms: 0,
    premium_rooms: 0,
    avg_nightly_rate: 0,
  };

  const currentRoomsUrl = buildCurrentRoomsUrl(params);

  const summaryCards = [
    {
      label: "Total Rooms",
      value: stats.total_rooms,
      hint: "All available room records",
      icon: "▤",
      colorClass: "text-sky-600",
    },
    {
      label: "Active Rooms",
      value: stats.active_rooms,
      hint: "Currently bookable",
      icon: "✓",
      colorClass: "text-emerald-600",
    },
    {
      label: "Premium Rooms",
      value: stats.premium_rooms,
      hint: "Premium room categories",
      icon: "♕",
      colorClass: "text-violet-600",
    },
    {
      label: "Avg. Nightly Rate",
      value: formatCurrency(stats.avg_nightly_rate),
      hint: "Average weekday/weekend",
      icon: "₹",
      colorClass: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rooms</h1>
          <p className="text-slate-500">
            Manage and oversee all rooms across your properties.
          </p>
        </div>

        <Link
          href="/admin/rooms/new"
          className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
        >
          Add Room
        </Link>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <div className="grid gap-4 md:grid-cols-4">
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
        <form className="grid gap-3 border-b p-4 md:grid-cols-5">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search rooms by name or property..."
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600 md:col-span-2"
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
            name="room_type"
            defaultValue={roomType}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Room Types</option>
            {roomTypes.map((type) => (
              <option key={type} value={type}>
                {formatRoomType(type)}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Status</option>
            {roomStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>

          <div className="flex gap-2 md:col-span-5">
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
              Filter
            </button>

            <Link
              href="/admin/rooms"
              className="rounded-xl border px-4 py-2 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="overflow-auto">
          <table className="w-full min-w-[1150px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Room Name</th>
                <th className="p-3">Property</th>
                <th className="p-3">Room Type</th>
                <th className="p-3">Max Guests</th>
                <th className="p-3">Weekday Rate</th>
                <th className="p-3">Weekend Rate</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((room) => {
                  const imageUrl = getMediaUrl(room.property_cover_image);

                  return (
                    <tr key={room.id} className="border-t align-middle">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={room.name}
                              className="h-14 w-20 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500">
                              No Image
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-slate-900">
                              {room.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {room.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-medium text-slate-800">
                          {room.property_name ?? "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {[room.location_name, room.district_name]
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </p>
                      </td>

                      <td className="p-3">
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                          {formatRoomType(room.room_type)}
                        </span>
                      </td>

                      <td className="p-3">{room.max_guests}</td>

                      <td className="p-3">
                        {formatCurrency(room.weekday_rate)}
                      </td>

                      <td className="p-3">
                        {formatCurrency(room.weekend_rate)}
                      </td>

                      <td className="p-3">
                        <form action={setRoomStatus} className="space-y-2">
                          <input type="hidden" name="id" value={room.id} />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentRoomsUrl}
                          />

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
                              room.status,
                            )}`}
                          >
                            {formatStatus(room.status)}
                          </span>

                          <div className="flex gap-2">
                            <select
                              name="status"
                              defaultValue={room.status}
                              className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-cyan-600"
                            >
                              {roomStatuses.map((item) => (
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

                      <td className="p-3">{formatDate(room.created_at)}</td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/rooms/${room.id}`}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            View
                          </Link>

                          <Link
                            href={`/admin/rooms/${room.id}/edit`}
                            className="font-medium text-indigo-700 hover:underline"
                          >
                            Edit
                          </Link>

                          <form action={markRoomInactive}>
                            <input type="hidden" name="id" value={room.id} />
                            <input
                              type="hidden"
                              name="return_to"
                              value={currentRoomsUrl}
                            />

                            <button
                              type="submit"
                              className="font-medium text-rose-700 hover:underline"
                            >
                              Inactive
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
                    colSpan={9}
                    className="p-8 text-center text-slate-500"
                  >
                    No rooms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Showing {rows.length ? start + 1 : 0} to{" "}
            {Math.min(start + pageSize, total)} of {total} rooms
          </p>

          <div className="flex gap-2">
            {requestedPage > 1 ? (
              <Link
                className="rounded-lg border px-3 py-1 transition hover:bg-slate-50"
                href={buildRoomsPageUrl(params, requestedPage - 1)}
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
                href={buildRoomsPageUrl(params, requestedPage + 1)}
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