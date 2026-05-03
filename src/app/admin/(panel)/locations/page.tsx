//src\app\admin\(panel)\locations\page.tsx
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import {
  markDistrictInactive,
  markLocationInactive,
  markStateInactive,
} from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

type LocationStatsRow = {
  total_states: number;
  total_districts: number;
  total_locations: number;
  active_coverage: number;
};

type StateRow = {
  id: string;
  name: string;
  is_active: boolean;
  district_count: number;
  location_count: number;
};

type DistrictRow = {
  id: string;
  state_id: string;
  name: string;
  is_active: boolean;
  state_name: string | null;
  location_count: number;
};

type LocationRow = {
  id: string;
  state_id: string;
  district_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  state_name: string | null;
  district_name: string | null;
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

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-rose-200"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};
  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const [statsResult, statesResult, districtsResult, locationsResult] =
    await Promise.all([
      supabaseSelectPage<LocationStatsRow>(
        "v_admin_location_stats",
        "total_states,total_districts,total_locations,active_coverage",
        "",
        {
          from: 0,
          to: 0,
        },
      ),

      supabaseSelectPage<StateRow>(
        "v_admin_states",
        "id,name,is_active,district_count,location_count",
        "&order=name.asc",
        {
          from: 0,
          to: 4,
        },
      ),

      supabaseSelectPage<DistrictRow>(
        "v_admin_districts",
        "id,state_id,name,is_active,state_name,location_count",
        "&order=name.asc",
        {
          from: 0,
          to: 4,
        },
      ),

      supabaseSelectPage<LocationRow>(
        "v_admin_locations",
        "id,state_id,district_id,name,slug,is_active,state_name,district_name",
        "&order=name.asc",
        {
          from: 0,
          to: 9,
        },
      ),
    ]);

  const stats = statsResult.data[0] ?? {
    total_states: 0,
    total_districts: 0,
    total_locations: 0,
    active_coverage: 0,
  };

  const summaryCards = [
    {
      label: "States",
      value: stats.total_states,
      hint: "Coverage states",
      icon: "◎",
      colorClass: "text-sky-600",
    },
    {
      label: "Districts",
      value: stats.total_districts,
      hint: "Mapped districts",
      icon: "▥",
      colorClass: "text-amber-600",
    },
    {
      label: "Locations",
      value: stats.total_locations,
      hint: "Service locations",
      icon: "⌖",
      colorClass: "text-emerald-600",
    },
    {
      label: "Active Coverage",
      value: `${stats.active_coverage}%`,
      hint: "Active location coverage",
      icon: "◉",
      colorClass: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Locations</h1>
          <p className="text-slate-500">
            Manage states, districts, and locations across your coverage area.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/locations/states/new"
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Add State
          </Link>

          <Link
            href="/admin/locations/districts/new"
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Add District
          </Link>

          <Link
            href="/admin/locations/places/new"
            className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            Add Location
          </Link>
        </div>
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

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="font-semibold text-slate-900">States</h2>
              <p className="text-xs text-slate-500">
                Total {stats.total_states} states
              </p>
            </div>

            <Link
              href="/admin/locations/states/new"
              className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700"
            >
              Add State
            </Link>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">State Name</th>
                  <th className="p-3">Districts</th>
                  <th className="p-3">Locations</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {statesResult.data.map((state, index) => (
                  <tr key={state.id} className="border-t">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium text-slate-900">
                      {state.name}
                    </td>
                    <td className="p-3">{state.district_count}</td>
                    <td className="p-3">{state.location_count}</td>
                    <td className="p-3">
                      <ActiveBadge active={state.is_active} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/locations/states/${state.id}/edit`}
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          Edit
                        </Link>

                        <form action={markStateInactive}>
                          <input type="hidden" name="id" value={state.id} />
                          <input
                            type="hidden"
                            name="return_to"
                            value="/admin/locations"
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
                ))}

                {statesResult.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No states found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="font-semibold text-slate-900">Districts</h2>
              <p className="text-xs text-slate-500">
                Total {stats.total_districts} districts
              </p>
            </div>

            <Link
              href="/admin/locations/districts/new"
              className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
            >
              Add District
            </Link>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">District Name</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Locations</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {districtsResult.data.map((district, index) => (
                  <tr key={district.id} className="border-t">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium text-slate-900">
                      {district.name}
                    </td>
                    <td className="p-3">{district.state_name ?? "-"}</td>
                    <td className="p-3">{district.location_count}</td>
                    <td className="p-3">
                      <ActiveBadge active={district.is_active} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/locations/districts/${district.id}/edit`}
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          Edit
                        </Link>

                        <form action={markDistrictInactive}>
                          <input type="hidden" name="id" value={district.id} />
                          <input
                            type="hidden"
                            name="return_to"
                            value="/admin/locations"
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
                ))}

                {districtsResult.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No districts found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold text-slate-900">Locations</h2>
            <p className="text-xs text-slate-500">
              Total {stats.total_locations} locations
            </p>
          </div>

          <Link
            href="/admin/locations/places/new"
            className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
          >
            Add Location
          </Link>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">State</th>
                <th className="p-3">District</th>
                <th className="p-3">Location Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {locationsResult.data.map((location, index) => (
                <tr key={location.id} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{location.state_name ?? "-"}</td>
                  <td className="p-3">{location.district_name ?? "-"}</td>
                  <td className="p-3 font-medium text-slate-900">
                    {location.name}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {location.slug}
                    </span>
                  </td>
                  <td className="p-3">
                    <ActiveBadge active={location.is_active} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/locations/places/${location.id}/edit`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        Edit
                      </Link>

                      <form action={markLocationInactive}>
                        <input type="hidden" name="id" value={location.id} />
                        <input
                          type="hidden"
                          name="return_to"
                          value="/admin/locations"
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
              ))}

              {locationsResult.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No locations found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}