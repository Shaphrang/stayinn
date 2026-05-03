//src\app\admin\(panel)\properties\new\page.tsx
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/admin/property-form";
import { createProperty } from "../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type OwnerOption = {
  id: string;
  business_name: string;
};

type StateOption = {
  id: string;
  name: string;
};

type DistrictOption = {
  id: string;
  name: string;
  state_id: string;
};

type LocationOption = {
  id: string;
  name: string;
  district_id: string;
};

type PlatformSettingRow = {
  setting_value: unknown;
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

function getAmenitiesMaster(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};
  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const [owners, states, districts, locations, settings] = await Promise.all([
    supabaseSelectPage<OwnerOption>(
      "owner_profiles",
      "id,business_name",
      "&status=eq.approved&order=business_name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<StateOption>("states", "id,name", "&order=name.asc", {
      from: 0,
      to: 999,
    }),

    supabaseSelectPage<DistrictOption>(
      "districts",
      "id,name,state_id",
      "&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<LocationOption>(
      "locations",
      "id,name,district_id",
      "&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<PlatformSettingRow>(
      "platform_settings",
      "setting_value",
      "&setting_key=eq.property_amenities_master",
      {
        from: 0,
        to: 0,
      },
    ),
  ]);

  const amenitiesMaster = getAmenitiesMaster(settings.data[0]?.setting_value);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Create Property
          </h1>
          <p className="text-sm text-slate-500">
            Add a new accommodation listing under an approved owner.
          </p>
        </div>

        <Link
          href="/admin/properties"
          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          Back to Properties
        </Link>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <PropertyForm
        owners={owners.data}
        states={states.data}
        districts={districts.data}
        locations={locations.data}
        amenitiesMaster={amenitiesMaster}
        action={createProperty}
      />
    </div>
  );
}