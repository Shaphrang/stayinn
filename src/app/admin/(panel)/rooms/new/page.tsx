//src\app\admin\(panel)\rooms\new\page.tsx
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { RoomForm } from "@/components/admin/room-form";
import { createRoom } from "../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type PropertyOption = {
  id: string;
  name: string;
  status: string;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
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

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};
  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const properties = await supabaseSelectPage<PropertyOption>(
    "v_admin_properties",
    "id,name,status,location_name,district_name,state_name",
    "&order=name.asc",
    {
      from: 0,
      to: 999,
    },
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Create Room</h1>
          <p className="text-sm text-slate-500">
            Add a room/unit under an existing property.
          </p>
        </div>

        <Link
          href="/admin/rooms"
          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          Back to Rooms
        </Link>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <RoomForm properties={properties.data} action={createRoom} />
    </div>
  );
}