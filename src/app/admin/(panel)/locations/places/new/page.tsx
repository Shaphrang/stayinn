import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { LocationForm } from "@/components/admin/location-master-forms";
import { createLocation } from "../../actions";

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

export default async function NewLocationPage() {
  await requirePlatformAdmin();

  const [states, districts] = await Promise.all([
    supabaseSelectPage<StateOption>(
      "states",
      "id,name,is_active",
      "&is_active=eq.true&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<DistrictOption>(
      "districts",
      "id,state_id,name,is_active",
      "&is_active=eq.true&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Add Location
          </h1>
          <p className="text-sm text-slate-500">
            Create a locality or coverage area under a district.
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
        states={states.data}
        districts={districts.data}
        action={createLocation}
      />
    </div>
  );
}