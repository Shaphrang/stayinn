import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { LocationForm } from "@/components/admin/location-master-forms";
import { updateLocation } from "../../../actions";

type StateOption = {
  id: string;
  name: string;
  is_active: boolean;
};

type DistrictOption = {
  id: string;
  state_id: string;
  name: string;
  is_active: boolean;
};

type LocationRow = {
  id: string;
  state_id: string;
  district_id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

function isPostgresUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;

  if (!isPostgresUuid(id)) {
    return notFound();
  }

  const [locationResult, states, districts] = await Promise.all([
    supabaseSelectPage<LocationRow>(
      "locations",
      "id,state_id,district_id,name,slug,is_active",
      `&id=eq.${id}`,
      {
        from: 0,
        to: 0,
      },
    ),

    supabaseSelectPage<StateOption>(
      "states",
      "id,name,is_active",
      "&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<DistrictOption>(
      "districts",
      "id,state_id,name,is_active",
      "&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),
  ]);

  const location = locationResult.data[0];

  if (!location) {
    return notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit Location
          </h1>
          <p className="text-sm text-slate-500">
            Update locality, district, slug, and active status.
          </p>
        </div>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back
        </Link>
      </div>

      <LocationForm
        data={location}
        states={states.data}
        districts={districts.data}
        action={updateLocation}
      />
    </div>
  );
}