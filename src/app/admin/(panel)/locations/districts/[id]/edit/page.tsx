import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { DistrictForm } from "@/components/admin/location-master-forms";
import { updateDistrict } from "../../../actions";

type StateOption = {
  id: string;
  name: string;
  is_active: boolean;
};

type DistrictRow = {
  id: string;
  state_id: string;
  name: string;
  is_active: boolean;
};

function isPostgresUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function EditDistrictPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;

  if (!isPostgresUuid(id)) {
    return notFound();
  }

  const [districtResult, statesResult] = await Promise.all([
    supabaseSelectPage<DistrictRow>(
      "districts",
      "id,state_id,name,is_active",
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
  ]);

  const district = districtResult.data[0];

  if (!district) {
    return notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit District
          </h1>
          <p className="text-sm text-slate-500">
            Update district and linked state.
          </p>
        </div>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back
        </Link>
      </div>

      <DistrictForm
        data={district}
        states={statesResult.data}
        action={updateDistrict}
      />
    </div>
  );
}