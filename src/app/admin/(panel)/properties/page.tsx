//src\app\admin\(panel)\properties\page.tsx
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import {
  supabaseCount,
  supabaseSelectPage,
} from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  deleteProperty,
  setPropertyStatus,
  togglePropertyFeatured,
  togglePropertyVerified,
} from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

type PropertyType =
  | "homestay"
  | "resort"
  | "guest_house"
  | "hotel"
  | "cottage"
  | "villa"
  | "apartment"
  | "camping"
  | "other";

type PropertyStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "inactive"
  | "rejected"
  | "suspended";

type PropertyListRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  property_type: PropertyType;
  status: PropertyStatus;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  owner_business_name: string | null;
  state_name: string | null;
  district_name: string | null;
  location_name: string | null;
};

type OwnerOption = {
  id: string;
  business_name: string;
};

type LocationOption = {
  id: string;
  name: string;
};

const pageSizeOptions = [10, 20] as const;

const propertyTypes: PropertyType[] = [
  "homestay",
  "resort",
  "guest_house",
  "hotel",
  "cottage",
  "villa",
  "apartment",
  "camping",
  "other",
];

const propertyStatuses: PropertyStatus[] = [
  "draft",
  "pending_review",
  "active",
  "inactive",
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

function isPropertyType(value: string): value is PropertyType {
  return propertyTypes.includes(value as PropertyType);
}

function isPropertyStatus(value: string): value is PropertyStatus {
  return propertyStatuses.includes(value as PropertyStatus);
}

function formatStatus(status: PropertyStatus) {
  const labels: Record<PropertyStatus, string> = {
    draft: "Draft",
    pending_review: "Pending",
    active: "Published",
    inactive: "Inactive",
    rejected: "Rejected",
    suspended: "Suspended",
  };

  return labels[status];
}

function formatPropertyType(type: PropertyType) {
  const labels: Record<PropertyType, string> = {
    homestay: "Homestay",
    resort: "Resort",
    guest_house: "Guest House",
    hotel: "Hotel",
    cottage: "Cottage",
    villa: "Villa",
    apartment: "Apartment",
    camping: "Camping",
    other: "Other",
  };

  return labels[type];
}

function getStatusBadgeClass(status: PropertyStatus) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "pending_review" || status === "draft") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (status === "rejected" || status === "suspended") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function sanitizeSearch(value: string) {
  return value
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function buildPropertyFilterQuery({
  q,
  status,
  propertyType,
  ownerId,
  locationId,
}: {
  q: string;
  status: string;
  propertyType: string;
  ownerId: string;
  locationId: string;
}) {
  const filters: string[] = [];

  if (status && isPropertyStatus(status)) {
    filters.push(`status=eq.${status}`);
  }

  if (propertyType && isPropertyType(propertyType)) {
    filters.push(`property_type=eq.${propertyType}`);
  }

  if (ownerId) {
    filters.push(`owner_id=eq.${ownerId}`);
  }

  if (locationId) {
    filters.push(`location_id=eq.${locationId}`);
  }

  const search = sanitizeSearch(q);

  if (search) {
    const pattern = encodeURIComponent(`*${search}*`);

    filters.push(
      [
        "or=(",
        `name.ilike.${pattern},`,
        `slug.ilike.${pattern},`,
        `owner_business_name.ilike.${pattern},`,
        `state_name.ilike.${pattern},`,
        `district_name.ilike.${pattern},`,
        `location_name.ilike.${pattern}`,
        ")",
      ].join(""),
    );
  }

  return filters.length ? `&${filters.join("&")}` : "";
}

function buildPropertiesPageUrl(params: SearchParams, page: number) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  nextParams.set("page", String(page));

  return `/admin/properties?${nextParams.toString()}`;
}

function buildCurrentPropertiesUrl(params: SearchParams) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (!normalizedValue) return;
    if (key === "success" || key === "error") return;

    nextParams.set(key, normalizedValue);
  });

  const query = nextParams.toString();

  return query ? `/admin/properties?${query}` : "/admin/properties";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getMediaUrl(path?: string | null) {
  if (!path) return "";

  const trimmed = path.trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  const { url } = getSupabaseEnv();

  return `${url.replace(/\/$/, "")}/storage/v1/object/public/stayinn-media/${trimmed}`;
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

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = (await searchParams) ?? {};

  const q = getParam(params, "q").trim();
  const rawStatus = getParam(params, "status").trim();
  const rawPropertyType = getParam(params, "property_type").trim();
  const ownerId = getParam(params, "owner_id").trim();
  const locationId = getParam(params, "location_id").trim();

  const status = isPropertyStatus(rawStatus) ? rawStatus : "";
  const propertyType = isPropertyType(rawPropertyType) ? rawPropertyType : "";

  const requestedPage = Math.max(Number(getParam(params, "page", "1")) || 1, 1);
  const requestedPageSize = Number(getParam(params, "pageSize", "10"));
  const pageSize = pageSizeOptions.includes(
    requestedPageSize as (typeof pageSizeOptions)[number],
  )
    ? requestedPageSize
    : 10;

  const success = getParam(params, "success");
  const error = getParam(params, "error");

  const filterQuery = buildPropertyFilterQuery({
    q,
    status,
    propertyType,
    ownerId,
    locationId,
  });

  const start = (requestedPage - 1) * pageSize;
  const end = start + pageSize - 1;

  const [
    propertiesResult,
    totalProperties,
    activeProperties,
    pendingProperties,
    featuredProperties,
    ownersResult,
    locationsResult,
  ] = await Promise.all([
    supabaseSelectPage<PropertyListRow>(
      "v_admin_properties",
      [
        "id",
        "owner_id",
        "name",
        "slug",
        "cover_image",
        "property_type",
        "status",
        "is_verified",
        "is_featured",
        "created_at",
        "owner_business_name",
        "state_name",
        "district_name",
        "location_name",
      ].join(","),
      `${filterQuery}&order=created_at.desc`,
      {
        from: start,
        to: end,
      },
    ),

    supabaseCount("v_admin_properties"),

    supabaseCount("v_admin_properties", "&status=eq.active"),

    supabaseCount("v_admin_properties", "&status=eq.pending_review"),

    supabaseCount("v_admin_properties", "&is_featured=eq.true"),

    supabaseSelectPage<OwnerOption>(
      "owner_profiles",
      "id,business_name",
      "&status=eq.approved&order=business_name.asc",
      {
        from: 0,
        to: 499,
      },
    ),

    supabaseSelectPage<LocationOption>(
      "locations",
      "id,name",
      "&order=name.asc",
      {
        from: 0,
        to: 499,
      },
    ),
  ]);

  const rows = propertiesResult.data;
  const total = propertiesResult.count;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const currentPropertiesUrl = buildCurrentPropertiesUrl(params);

  const summaryCards = [
    {
      label: "Total Properties",
      value: totalProperties,
      hint: "All listed properties",
      colorClass: "text-sky-600",
      icon: "⌂",
    },
    {
      label: "Active",
      value: activeProperties,
      hint: "Published listings",
      colorClass: "text-emerald-600",
      icon: "✓",
    },
    {
      label: "Pending Review",
      value: pendingProperties,
      hint: "Awaiting approval",
      colorClass: "text-amber-600",
      icon: "◷",
    },
    {
      label: "Featured",
      value: featuredProperties,
      hint: "Promoted listings",
      colorClass: "text-violet-600",
      icon: "☆",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500">
            Manage and monitor all properties listed on StayInn.
          </p>
        </div>

        <Link
          href="/admin/properties/new"
          className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
        >
          Add Property
        </Link>
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

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <form className="grid gap-3 border-b p-4 md:grid-cols-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search properties by name, owner or location..."
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600 md:col-span-2"
          />

          <select
            name="property_type"
            defaultValue={propertyType}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Types</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {formatPropertyType(type)}
              </option>
            ))}
          </select>

          <select
            name="location_id"
            defaultValue={locationId}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Locations</option>
            {locationsResult.data.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Statuses</option>
            {propertyStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>

          <select
            name="owner_id"
            defaultValue={ownerId}
            className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">All Owners</option>
            {ownersResult.data.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.business_name}
              </option>
            ))}
          </select>

          <div className="flex gap-2 md:col-span-6">
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
            >
              Apply Filters
            </button>

            <Link
              href="/admin/properties"
              className="rounded-xl border px-4 py-2 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          </div>
        </form>

        <div className="overflow-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Property</th>
                <th className="p-3">Type</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verified</th>
                <th className="p-3">Featured</th>
                <th className="p-3">Created Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((property) => {
                  const imageUrl = getMediaUrl(property.cover_image);

                  return (
                    <tr key={property.id} className="border-t align-middle">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={property.name}
                              className="h-14 w-20 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500">
                              No Image
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-slate-900">
                              {property.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {property.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {formatPropertyType(property.property_type)}
                      </td>

                      <td className="p-3">
                        {property.owner_business_name ?? "-"}
                      </td>

                      <td className="p-3">
                        <div>
                          <p>{property.location_name ?? "-"}</p>
                          <p className="text-xs text-slate-500">
                            {[property.district_name, property.state_name]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </p>
                        </div>
                      </td>

                      <td className="p-3">
                        <form
                          action={setPropertyStatus}
                          className="space-y-2"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={property.id}
                          />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentPropertiesUrl}
                          />

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
                              property.status,
                            )}`}
                          >
                            {formatStatus(property.status)}
                          </span>

                          <div className="flex gap-2">
                            <select
                              name="status"
                              defaultValue={property.status}
                              className="rounded-lg border px-2 py-1 text-xs outline-none focus:border-cyan-600"
                            >
                              {propertyStatuses.map((item) => (
                                <option key={item} value={item}>
                                  {formatStatus(item)}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      </td>

                      <td className="p-3">
                        <form action={togglePropertyVerified}>
                          <input
                            type="hidden"
                            name="id"
                            value={property.id}
                          />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentPropertiesUrl}
                          />
                          <input
                            type="hidden"
                            name="value"
                            value={String(!property.is_verified)}
                          />
                          <button
                            type="submit"
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                              property.is_verified
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-rose-50 text-rose-700 ring-rose-200"
                            }`}
                          >
                            {property.is_verified ? "Yes" : "No"}
                          </button>
                        </form>
                      </td>

                      <td className="p-3">
                        <form action={togglePropertyFeatured}>
                          <input
                            type="hidden"
                            name="id"
                            value={property.id}
                          />
                          <input
                            type="hidden"
                            name="return_to"
                            value={currentPropertiesUrl}
                          />
                          <input
                            type="hidden"
                            name="value"
                            value={String(!property.is_featured)}
                          />
                          <button
                            type="submit"
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                              property.is_featured
                                ? "bg-violet-50 text-violet-700 ring-violet-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {property.is_featured ? "Yes" : "No"}
                          </button>
                        </form>
                      </td>

                      <td className="p-3">{formatDate(property.created_at)}</td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/properties/${property.id}`}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            View
                          </Link>

                          <Link
                            href={`/admin/properties/${property.id}/edit`}
                            className="font-medium text-indigo-700 hover:underline"
                          >
                            Edit
                          </Link>

                          <form action={deleteProperty}>
                            <input
                              type="hidden"
                              name="id"
                              value={property.id}
                            />
                            <input
                              type="hidden"
                              name="return_to"
                              value={currentPropertiesUrl}
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
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center text-slate-500"
                  >
                    No properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Showing {rows.length ? start + 1 : 0} to{" "}
            {Math.min(start + pageSize, total)} of {total} properties
          </p>

          <div className="flex gap-2">
            {requestedPage > 1 ? (
              <Link
                className="rounded-lg border px-3 py-1 transition hover:bg-slate-50"
                href={buildPropertiesPageUrl(params, requestedPage - 1)}
              >
                Prev
              </Link>
            ) : null}

            <span className="rounded-lg bg-cyan-700 px-3 py-1 text-white">
              {requestedPage}
            </span>

            {requestedPage < totalPages ? (
              <Link
                className="rounded-lg border px-3 py-1 transition hover:bg-slate-50"
                href={buildPropertiesPageUrl(params, requestedPage + 1)}
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}