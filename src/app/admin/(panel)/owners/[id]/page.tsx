//src\app\admin\(panel)\owners\[id]\page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { markOwnerInactiveAction } from "../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type OwnerStatus = "pending" | "approved" | "rejected" | "suspended";

type OwnerDetailRow = {
  id: string;
  profile_id: string;
  business_name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  status: OwnerStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string | null;
  profile_full_name: string | null;
  profile_email: string | null;
  profile_phone: string | null;
  profile_is_active: boolean | null;
};

function isPostgresUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getParam(params: SearchParams, key: string, fallback = "") {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: OwnerStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusBadgeClass(status: OwnerStatus) {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "pending") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (status === "rejected") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
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

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-medium text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

export default async function OwnerViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;

  if (!isPostgresUuid(id)) {
    return notFound();
  }

  const queryParams = (await searchParams) ?? {};
  const success = getParam(queryParams, "success");
  const error = getParam(queryParams, "error");

  const ownerResult = await supabaseSelectPage<OwnerDetailRow>(
    "v_admin_owners",
    [
      "id",
      "profile_id",
      "business_name",
      "contact_person",
      "phone",
      "email",
      "address",
      "status",
      "remarks",
      "created_at",
      "updated_at",
      "profile_full_name",
      "profile_email",
      "profile_phone",
      "profile_is_active",
    ].join(","),
    `&id=eq.${id}`,
    {
      from: 0,
      to: 0,
    },
  );

  const owner = ownerResult.data[0];

  if (!owner) {
    return notFound();
  }

  const isInactive =
    owner.status === "suspended" || owner.profile_is_active === false;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Owner Details
          </h1>
          <p className="text-sm text-slate-500">
            View owner information, linked profile, and account status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/owners"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Back
          </Link>

          <Link
            href={`/admin/owners/${owner.id}/edit`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Edit Owner
          </Link>
        </div>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {owner.business_name}
            </h2>
            <p className="text-sm text-slate-500">
              {owner.contact_person ||
                owner.profile_full_name ||
                "No owner name"}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
              owner.status,
            )}`}
          >
            {formatStatus(owner.status)}
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Detail label="Business Name" value={owner.business_name} />
          <Detail
            label="Owner Name"
            value={owner.contact_person || owner.profile_full_name}
          />
          <Detail label="Phone" value={owner.phone || owner.profile_phone} />
          <Detail label="Email" value={owner.email || owner.profile_email} />
          <Detail label="Status" value={formatStatus(owner.status)} />
          <Detail
            label="Account Active"
            value={owner.profile_is_active ? "Yes" : "No"}
          />
          <Detail label="Address" value={owner.address} />
          <Detail label="Remarks" value={owner.remarks} />
          <Detail label="Created" value={formatDateTime(owner.created_at)} />
          <Detail label="Updated" value={formatDateTime(owner.updated_at)} />
        </div>
      </div>

      <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Account Action</h3>
        <p className="mt-1 text-sm text-slate-500">
          Marking inactive will suspend the owner and deactivate the linked
          profile account.
        </p>

        <form action={markOwnerInactiveAction} className="mt-4">
          <input type="hidden" name="id" value={owner.id} />
          <input type="hidden" name="profile_id" value={owner.profile_id} />
          <input
            type="hidden"
            name="return_to"
            value={`/admin/owners/${owner.id}`}
          />

          <button
            type="submit"
            disabled={isInactive}
            className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isInactive ? "Already Inactive" : "Mark Inactive"}
          </button>
        </form>
      </div>
    </div>
  );
}