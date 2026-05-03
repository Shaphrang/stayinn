import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import {
  supabaseCount,
  supabaseSelectPage,
} from "@/lib/supabase/server";
import {
  markOwnerInactiveAction,
  setOwnerStatusAction,
} from "./actions";

type OwnerStatus = "pending" | "approved" | "rejected" | "suspended";

type SearchParams = Record<string, string | string[] | undefined>;

type OwnerListRow = {
  id: string;
  profile_id: string;
  business_name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  status: OwnerStatus;
  created_at: string;
  profile_full_name: string | null;
  profile_email: string | null;
  profile_phone: string | null;
  profile_is_active: boolean | null;
};

const pageSizeOptions = [10, 20] as const;

const ownerStatuses: OwnerStatus[] = [
  "pending",
  "approved",
  "rejected",
  "suspended",
];

function getParam(params: SearchParams, key: string, fallback = "") {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function isOwnerStatus(value: string): value is OwnerStatus {
  return ownerStatuses.includes(value as OwnerStatus);
}

function formatStatus(status: OwnerStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function sanitizeSearch(value: string) {
  return value
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function buildOwnerFilterQuery({
  q,
  status,
}: {
  q: string;
  status: string;
}) {
  const filters: string[] = [];

  if (status && isOwnerStatus(status)) {
    filters.push(`status=eq.${status}`);
  }

  const search = sanitizeSearch(q);

  if (search) {
    const pattern = encodeURIComponent(`*${search}*`);

    filters.push(
      [
        "or=(",
        `business_name.ilike.${pattern},`,
        `contact_person.ilike.${pattern},`,
        `phone.ilike.${pattern},`,
        `email.ilike.${pattern},`,
        `profile_full_name.ilike.${pattern},`,
        `profile_email.ilike.${pattern},`,
        `profile_phone.ilike.${pattern}`,
        ")",
      ].join(""),
    );
  }

  return filters.length ? `&${filters.join("&")}` : "";
}

function buildOwnersPageUrl(params: SearchParams, page: number) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  nextParams.set("page", String(page));

  return `/admin/owners?${nextParams.toString()}`;
}

function buildCurrentOwnersUrl(params: SearchParams) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  const query = nextParams.toString();

  return query ? `/admin/owners?${query}` : "/admin/owners";
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

export default async function OwnersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};

  const q = getParam(params, "q").trim();
  const rawStatus = getParam(params, "status").trim().toLowerCase();
  const status = isOwnerStatus(rawStatus) ? rawStatus : "";

  const requestedPage = Math.max(Number(getParam(params, "page", "1")) || 1, 1);
  const requestedPageSize = Number(getParam(params, "pageSize", "10"));
  const pageSize = pageSizeOptions.includes(
    requestedPageSize as (typeof pageSizeOptions)[number],
  )
    ? requestedPageSize
    : 10;

  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const filterQuery = buildOwnerFilterQuery({
    q,
    status,
  });

  const start = (requestedPage - 1) * pageSize;
  const end = start + pageSize - 1;

  const [
    ownersResult,
    totalOwners,
    approvedOwners,
    pendingOwners,
    inactiveOwners,
  ] = await Promise.all([
    supabaseSelectPage<OwnerListRow>(
      "v_admin_owners",
      [
        "id",
        "profile_id",
        "business_name",
        "contact_person",
        "phone",
        "email",
        "status",
        "created_at",
        "profile_full_name",
        "profile_email",
        "profile_phone",
        "profile_is_active",
      ].join(","),
      `${filterQuery}&order=created_at.desc`,
      {
        from: start,
        to: end,
      },
    ),

    supabaseCount("v_admin_owners"),

    supabaseCount("v_admin_owners", "&status=eq.approved"),

    supabaseCount("v_admin_owners", "&status=eq.pending"),

    supabaseCount(
      "v_admin_owners",
      "&or=(profile_is_active.eq.false,status.eq.suspended)",
    ),
  ]);

  const total = ownersResult.count;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  if (requestedPage > totalPages && total > 0) {
    redirect(buildOwnersPageUrl(params, totalPages));
  }

  const rows = ownersResult.data;
  const currentOwnersUrl = buildCurrentOwnersUrl(params);

  const summaryCards = [
    {
      label: "Total Owners",
      value: totalOwners,
      colorClass: "text-sky-600",
    },
    {
      label: "Approved Owners",
      value: approvedOwners,
      colorClass: "text-emerald-600",
    },
    {
      label: "Pending Owners",
      value: pendingOwners,
      colorClass: "text-amber-600",
    },
    {
      label: "Inactive Owners",
      value: inactiveOwners,
      colorClass: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Owners</h1>
          <p className="text-slate-500">
            Manage property owners and account status.
          </p>
        </div>

        <Link
          href="/admin/owners/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800"
        >
          Add Owner
        </Link>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.colorClass}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <form className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search business, owner, phone, email"
          className="rounded-xl border px-3 py-2 outline-none focus:border-slate-400 md:col-span-3"
        />

        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
        >
          <option value="">All Statuses</option>
          {ownerStatuses.map((ownerStatus) => (
            <option key={ownerStatus} value={ownerStatus}>
              {formatStatus(ownerStatus)}
            </option>
          ))}
        </select>

        <select
          name="pageSize"
          defaultValue={String(pageSize)}
          className="rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
          >
            Apply
          </button>

          <Link
            href="/admin/owners"
            className="rounded-xl border px-4 py-2 transition hover:bg-slate-50"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="p-3">Business Name</th>
              <th className="p-3">Owner Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((owner) => {
                const ownerName =
                  owner.contact_person || owner.profile_full_name || "-";

                const ownerEmail =
                  owner.email || owner.profile_email || "-";

                return (
                  <tr key={owner.id} className="border-t align-top">
                    <td className="p-3 font-semibold text-slate-900">
                      {owner.business_name}
                    </td>

                    <td className="p-3">{ownerName}</td>

                    <td className="p-3">{owner.phone}</td>

                    <td className="p-3">{ownerEmail}</td>

                    <td className="p-3">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
                            owner.status,
                          )}`}
                        >
                          {formatStatus(owner.status)}
                        </span>

                        <form
                          action={setOwnerStatusAction}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="id" value={owner.id} />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentOwnersUrl}
                          />

                          <select
                            name="status"
                            defaultValue={owner.status}
                            className="rounded-lg border px-2 py-1 outline-none focus:border-slate-400"
                          >
                            {ownerStatuses.map((ownerStatus) => (
                              <option key={ownerStatus} value={ownerStatus}>
                                {formatStatus(ownerStatus)}
                              </option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className="rounded bg-slate-100 px-2 py-1 text-slate-700 transition hover:bg-slate-200"
                          >
                            Save
                          </button>
                        </form>
                      </div>
                    </td>

                    <td className="p-3">{formatDate(owner.created_at)}</td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/owners/${owner.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/admin/owners/${owner.id}/edit`}
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          Edit
                        </Link>

                        <form action={markOwnerInactiveAction}>
                          <input type="hidden" name="id" value={owner.id} />
                          <input
                            type="hidden"
                            name="profile_id"
                            value={owner.profile_id}
                          />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentOwnersUrl}
                          />

                          <button
                            type="submit"
                            className="font-medium text-rose-700 hover:underline"
                          >
                            Mark Inactive
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-slate-500"
                >
                  No owners found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600">
          Showing {rows.length ? start + 1 : 0} to{" "}
          {Math.min(start + pageSize, total)} of {total} owners
        </p>

        <div className="flex gap-2">
          {requestedPage > 1 ? (
            <Link
              className="rounded-lg border px-3 py-1 transition hover:bg-slate-50"
              href={buildOwnersPageUrl(params, requestedPage - 1)}
            >
              Prev
            </Link>
          ) : null}

          <span className="rounded-lg bg-slate-900 px-3 py-1 text-white">
            {requestedPage}
          </span>

          {requestedPage < totalPages ? (
            <Link
              className="rounded-lg border px-3 py-1 transition hover:bg-slate-50"
              href={buildOwnersPageUrl(params, requestedPage + 1)}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}