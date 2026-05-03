import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { StateForm } from "@/components/admin/location-master-forms";
import { createState } from "../../actions";

export default async function NewStatePage() {
  await requirePlatformAdmin();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Add State</h1>
          <p className="text-sm text-slate-500">
            Create a new coverage state.
          </p>
        </div>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back
        </Link>
      </div>

      <StateForm action={createState} />
    </div>
  );
}