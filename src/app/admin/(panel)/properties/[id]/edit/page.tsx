//src\app\admin\(panel)\properties\[id]\edit\page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseSelectPage } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/admin/property-form";
import { updateProperty } from "../../actions";

type SearchParams = Record<string, string | string[] | undefined>;

type OwnerOption = {
  id: string;
  business_name: string;
};

type StateOption = {
  id: string;
  name: string;
};

type DistrictOption = {
  id: string;
  name: string;
  state_id: string;
};

type LocationOption = {
  id: string;
  name: string;
  district_id: string;
};

type PlatformSettingRow = {
  setting_value: unknown;
};

type PropertyFormData = {
  id: string;
  owner_id: string;
  state_id: string;
  district_id: string;
  location_id: string;
  name: string;
  slug: string;
  property_type: string;
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
  status: string;
  is_featured: boolean;
  is_verified: boolean;
  admin_notes: string | null;
  owner_business_name: string | null;
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

function getAmenitiesMaster(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function EditPropertyPage({
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

  const propertyResult = await supabaseSelectPage<PropertyFormData>(
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
      "owner_business_name",
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

  const [owners, states, districts, locations, settings] = await Promise.all([
    supabaseSelectPage<OwnerOption>(
      "owner_profiles",
      "id,business_name",
      `&or=(status.eq.approved,id.eq.${property.owner_id})&order=business_name.asc`,
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<StateOption>("states", "id,name", "&order=name.asc", {
      from: 0,
      to: 999,
    }),

    supabaseSelectPage<DistrictOption>(
      "districts",
      "id,name,state_id",
      "&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<LocationOption>(
      "locations",
      "id,name,district_id",
      "&order=name.asc",
      {
        from: 0,
        to: 999,
      },
    ),

    supabaseSelectPage<PlatformSettingRow>(
      "platform_settings",
      "setting_value",
      "&setting_key=eq.property_amenities_master",
      {
        from: 0,
        to: 0,
      },
    ),
  ]);

  const hasCurrentOwner = owners.data.some(
    (owner) => owner.id === property.owner_id,
  );

  const safeOwners = hasCurrentOwner
    ? owners.data
    : [
        {
          id: property.owner_id,
          business_name: property.owner_business_name ?? "Current owner",
        },
        ...owners.data,
      ];

  const amenitiesMaster = getAmenitiesMaster(settings.data[0]?.setting_value);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit Property
          </h1>
          <p className="text-sm text-slate-500">
            Update listing details, location, images, amenities and status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/properties/${property.id}`}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            View Property
          </Link>

          <Link
            href="/admin/properties"
            className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          >
            Back to Properties
          </Link>
        </div>
      </div>

      <MessageBox type="success" message={success} />
      <MessageBox type="error" message={error} />

      <PropertyForm
        data={property}
        owners={safeOwners}
        states={states.data}
        districts={districts.data}
        locations={locations.data}
        amenitiesMaster={amenitiesMaster}
        action={updateProperty}
      />
    </div>
  );
}