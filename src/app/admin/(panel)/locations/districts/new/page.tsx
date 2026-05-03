import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { DistrictForm } from "@/components/admin/location-master-forms";
import { createDistrict } from "../../actions";

type StateOption = {
  id: string;
  name: string;
  is_active: boolean;
};

export default async function NewDistrictPage() {
  await requirePlatformAdmin();

  const states = await supabaseSelectPage<StateOption>(
    "states",
    "id,name,is_active",
    "&is_active=eq.true&order=name.asc",
    {
      from: 0,
      to: 999,
    },
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Add District
          </h1>
          <p className="text-sm text-slate-500">
            Create a district under a state.
          </p>
        </div>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back
        </Link>
      </div>

      <DistrictForm states={states.data} action={createDistrict} />
    </div>
  );
}