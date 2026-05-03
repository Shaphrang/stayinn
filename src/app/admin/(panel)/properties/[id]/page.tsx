//src\app\admin\(panel)\properties\[id]\page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { supabaseSelectPage } from "@/lib/supabase/server";
import {
  deleteProperty,
  setPropertyStatus,
  togglePropertyFeatured,
  togglePropertyVerified,
} from "../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type PropertyStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "inactive"
  | "rejected"
  | "suspended";

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

type PropertyDetailRow = {
  id: string;
  owner_id: string;
  state_id: string;
  district_id: string;
  location_id: string;
  name: string;
  slug: string;
  property_type: PropertyType;
  short_description: string | null;
  description: string | null;
  address: string | null;
  landmark: string | null;
  pincode: string | null;
  contact_phone: string;
  contact_email: string | null;
  whatsapp_number: string | null;
  cover_image: string | null;
  gallery_images: string[] | null;
  amenities: string[] | null;
  rules: string[] | null;
  check_in_time: string | null;
  check_out_time: string | null;
  status: PropertyStatus;
  is_featured: boolean;
  is_verified: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  owner_business_name: string | null;
  state_name: string | null;
  district_name: string | null;
  location_name: string | null;
};

const propertyStatuses: PropertyStatus[] = [
  "draft",
  "pending_review",
  "active",
  "inactive",
  "rejected",
  "suspended",
];

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

export default async function PropertyViewPage({
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

  const propertyResult = await supabaseSelectPage<PropertyDetailRow>(
    "v_admin_properties",
    [
      "id",
      "owner_id",
      "state_id",
      "district_id",
      "location_id",
      "name",
      "slug",
      "property_type",
      "short_description",
      "description",
      "address",
      "landmark",
      "pincode",
      "contact_phone",
      "contact_email",
      "whatsapp_number",
      "cover_image",
      "gallery_images",
      "amenities",
      "rules",
      "check_in_time",
      "check_out_time",
      "status",
      "is_featured",
      "is_verified",
      "admin_notes",
      "created_at",
      "updated_at",
      "owner_business_name",
      "state_name",
      "district_name",
      "location_name",
    ].join(","),
    `&id=eq.${id}`,
    {
      from: 0,
      to: 0,
    },
  );

  const property = propertyResult.data[0];

  if (!property) {
    return notFound();
  }

  const coverUrl = getMediaUrl(property.cover_image);
  const gallery = property.gallery_images ?? [];
  const amenities = property.amenities ?? [];
  const rules = property.rules ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {property.name}
          </h1>
          <p className="text-sm text-slate-500">
            {property.owner_business_name ?? "No owner"} ·{" "}
            {property.location_name ?? "No location"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/properties"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Back
          </Link>

          <Link
            href={`/admin/properties/${property.id}/edit`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Edit Property
          </Link>
        </div>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={property.name}
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="flex h-72 w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
              No cover image
            </div>
          )}

          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(
                  property.status,
                )}`}
              >
                {formatStatus(property.status)}
              </span>

              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {formatPropertyType(property.property_type)}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  property.is_verified
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-rose-50 text-rose-700 ring-rose-200"
                }`}
              >
                {property.is_verified ? "Verified" : "Not Verified"}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  property.is_featured
                    ? "bg-violet-50 text-violet-700 ring-violet-200"
                    : "bg-slate-100 text-slate-700 ring-slate-200"
                }`}
              >
                {property.is_featured ? "Featured" : "Not Featured"}
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              {property.description ||
                property.short_description ||
                "No description added."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-4 space-y-4">
            <form action={setPropertyStatus} className="space-y-2">
              <input type="hidden" name="id" value={property.id} />
              <input
                type="hidden"
                name="return_to"
                value={`/admin/properties/${property.id}`}
              />

              <label className="text-sm font-medium text-slate-700">
                Update Status
                <select
                  name="status"
                  defaultValue={property.status}
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
                >
                  {propertyStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save Status
              </button>
            </form>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <form action={togglePropertyVerified}>
                <input type="hidden" name="id" value={property.id} />
                <input
                  type="hidden"
                  name="return_to"
                  value={`/admin/properties/${property.id}`}
                />
                <input
                  type="hidden"
                  name="value"
                  value={String(!property.is_verified)}
                />
                <button
                  type="submit"
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {property.is_verified ? "Unverify" : "Verify"}
                </button>
              </form>

              <form action={togglePropertyFeatured}>
                <input type="hidden" name="id" value={property.id} />
                <input
                  type="hidden"
                  name="return_to"
                  value={`/admin/properties/${property.id}`}
                />
                <input
                  type="hidden"
                  name="value"
                  value={String(!property.is_featured)}
                />
                <button
                  type="submit"
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {property.is_featured ? "Remove Featured" : "Make Featured"}
                </button>
              </form>

              <form action={deleteProperty}>
                <input type="hidden" name="id" value={property.id} />
                <input
                  type="hidden"
                  name="return_to"
                  value={`/admin/properties/${property.id}`}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
                >
                  Mark Inactive
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          Property Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Detail label="Owner" value={property.owner_business_name} />
          <Detail label="Type" value={formatPropertyType(property.property_type)} />
          <Detail label="State" value={property.state_name} />
          <Detail label="District" value={property.district_name} />
          <Detail label="Location" value={property.location_name} />
          <Detail label="Slug" value={property.slug} />
          <Detail label="Phone" value={property.contact_phone} />
          <Detail label="Email" value={property.contact_email} />
          <Detail label="WhatsApp" value={property.whatsapp_number} />
          <Detail label="Pincode" value={property.pincode} />
          <Detail label="Check-in" value={property.check_in_time} />
          <Detail label="Check-out" value={property.check_out_time} />
          <Detail label="Created" value={formatDateTime(property.created_at)} />
          <Detail label="Updated" value={formatDateTime(property.updated_at)} />

          <div className="md:col-span-2">
            <Detail label="Address" value={property.address} />
          </div>

          <div className="md:col-span-2">
            <Detail label="Landmark" value={property.landmark} />
          </div>

          <div className="md:col-span-2">
            <Detail label="Admin Notes" value={property.admin_notes} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Amenities</h2>

          {amenities.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100"
                >
                  {amenity}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No amenities added.</p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Rules</h2>

          {rules.length > 0 ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No rules added.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Gallery</h2>

        {gallery.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {gallery.map((path) => {
              const url = getMediaUrl(path);

              return (
                <img
                  key={path}
                  src={url}
                  alt={property.name}
                  className="h-36 w-full rounded-xl object-cover"
                />
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No gallery images added.</p>
        )}
      </div>
    </div>
  );
}