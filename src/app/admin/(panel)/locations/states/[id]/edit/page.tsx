import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { StateForm } from "@/components/admin/location-master-forms";
import { updateState } from "../../../actions";

type StateRow = {
  id: string;
  name: string;
  is_active: boolean;
};

function isPostgresUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function EditStatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;

  if (!isPostgresUuid(id)) {
    return notFound();
  }

  const result = await supabaseSelectPage<StateRow>(
    "states",
    "id,name,is_active",
    `&id=eq.${id}`,
    {
      from: 0,
      to: 0,
    },
  );

  const state = result.data[0];

  if (!state) {
    return notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Edit State</h1>
          <p className="text-sm text-slate-500">
            Update coverage state details.
          </p>
        </div>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back
        </Link>
      </div>

      <StateForm data={state} action={updateState} />
    </div>
  );
}