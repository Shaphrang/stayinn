//src\components\admin\property-form.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

type PropertyFormData = {
  id?: string | null;
  owner_id?: string | null;
  state_id?: string | null;
  district_id?: string | null;
  location_id?: string | null;
  name?: string | null;
  slug?: string | null;
  property_type?: string | null;
  short_description?: string | null;
  description?: string | null;
  address?: string | null;
  landmark?: string | null;
  pincode?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  whatsapp_number?: string | null;
  cover_image?: string | null;
  gallery_images?: string[] | null;
  amenities?: string[] | null;
  rules?: string[] | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  status?: string | null;
  is_featured?: boolean | null;
  is_verified?: boolean | null;
  admin_notes?: string | null;
};

type PropertyFormProps = {
  data?: PropertyFormData;
  owners: OwnerOption[];
  states: StateOption[];
  districts: DistrictOption[];
  locations: LocationOption[];
  amenitiesMaster: string[];
  action: (formData: FormData) => void | Promise<void>;
};

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

const defaultPropertyAmenities = [
  "WiFi",
  "Parking",
  "Breakfast",
  "Restaurant",
  "Room Service",
  "Power Backup",
  "Hot Water",
  "Garden",
  "Mountain View",
  "River View",
  "Lake View",
  "Bonfire",
  "Pet Friendly",
  "Family Friendly",
  "Cafe",
  "Work Friendly",
  "Driver Stay",
  "CCTV",
  "Security",
  "Laundry",
];

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

function formatStatus(status: PropertyStatus) {
  const labels: Record<PropertyStatus, string> = {
    draft: "Draft",
    pending_review: "Pending Review",
    active: "Active / Published",
    inactive: "Inactive",
    rejected: "Rejected",
    suspended: "Suspended",
  };

  return labels[status];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return "";

  return `${supabaseUrl.replace(
    /\/$/,
    "",
  )}/storage/v1/object/public/stayinn-media/${trimmed}`;
}

export function PropertyForm({
  data,
  owners,
  states,
  districts,
  locations,
  amenitiesMaster,
  action,
}: PropertyFormProps) {
  const isEdit = Boolean(data?.id);

  const [name, setName] = useState(data?.name ?? "");
  const [slug, setSlug] = useState(data?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(data?.slug));

  const [selectedState, setSelectedState] = useState(data?.state_id ?? "");
  const [selectedDistrict, setSelectedDistrict] = useState(
    data?.district_id ?? "",
  );
  const [selectedLocation, setSelectedLocation] = useState(
    data?.location_id ?? "",
  );

  const [gallery, setGallery] = useState<string[]>(data?.gallery_images ?? []);

  const currentAmenities = data?.amenities ?? [];
  const currentRules = data?.rules ?? [];
  const coverUrl = getMediaUrl(data?.cover_image);

  const amenityOptions = useMemo(() => {
    return amenitiesMaster.length > 0
      ? amenitiesMaster
      : defaultPropertyAmenities;
  }, [amenitiesMaster]);

  const filteredDistricts = useMemo(() => {
    if (!selectedState) return districts;

    return districts.filter((district) => district.state_id === selectedState);
  }, [districts, selectedState]);

  const filteredLocations = useMemo(() => {
    if (!selectedDistrict) return locations;

    return locations.filter(
      (location) => location.district_id === selectedDistrict,
    );
  }, [locations, selectedDistrict]);

  const hasOwners = owners.length > 0;
  const hasStates = states.length > 0;
  const hasDistricts = filteredDistricts.length > 0;
  const hasLocations = filteredLocations.length > 0;

  return (
    <form action={action} className="space-y-6">
      {isEdit ? (
        <input type="hidden" name="id" value={data?.id ?? ""} />
      ) : null}

      <input
        type="hidden"
        name="cover_image"
        value={data?.cover_image ?? ""}
      />

      <input
        type="hidden"
        name="gallery_images"
        value={JSON.stringify(gallery)}
      />

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Basic Information
          </h2>
          <p className="text-sm text-slate-500">
            Enter the main listing details shown to users.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Owner
            <select
              name="owner_id"
              defaultValue={data?.owner_id ?? ""}
              required
              disabled={!hasOwners}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              <option value="" disabled>
                {hasOwners ? "Select owner" : "No approved owners available"}
              </option>

              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.business_name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Property Type
            <select
              name="property_type"
              defaultValue={data?.property_type ?? "homestay"}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {formatPropertyType(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Property Name
            <input
              name="name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);

                if (!isEdit && !slugTouched) {
                  setSlug(slugify(nextName));
                }
              }}
              required
              minLength={2}
              placeholder="Example: Serene Lake Resort"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Slug
            <input
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              required
              minLength={2}
              placeholder="serene-lake-resort"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              name="status"
              defaultValue={data?.status ?? "draft"}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {propertyStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Short Description
            <input
              name="short_description"
              defaultValue={data?.short_description ?? ""}
              placeholder="Short summary for cards and listings"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Full Description
            <textarea
              name="description"
              defaultValue={data?.description ?? ""}
              rows={5}
              placeholder="Detailed property description"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Location Details
          </h2>
          <p className="text-sm text-slate-500">
            Select state, district and locality for this property.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            State
            <select
              name="state_id"
              value={selectedState}
              onChange={(event) => {
                setSelectedState(event.target.value);
                setSelectedDistrict("");
                setSelectedLocation("");
              }}
              required
              disabled={!hasStates}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              <option value="" disabled>
                {hasStates ? "Select state" : "No states available"}
              </option>

              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            District
            <select
              name="district_id"
              value={selectedDistrict}
              onChange={(event) => {
                setSelectedDistrict(event.target.value);
                setSelectedLocation("");
              }}
              required
              disabled={!hasDistricts}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              <option value="" disabled>
                {hasDistricts ? "Select district" : "No districts available"}
              </option>

              {filteredDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Location
            <select
              name="location_id"
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              required
              disabled={!hasLocations}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              <option value="" disabled>
                {hasLocations ? "Select location" : "No locations available"}
              </option>

              {filteredLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Address
            <input
              name="address"
              defaultValue={data?.address ?? ""}
              placeholder="Full address"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Pincode
            <input
              name="pincode"
              defaultValue={data?.pincode ?? ""}
              placeholder="Example: 793001"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-3">
            Landmark
            <input
              name="landmark"
              defaultValue={data?.landmark ?? ""}
              placeholder="Nearby landmark"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact and Timing
          </h2>
          <p className="text-sm text-slate-500">
            Add contact numbers and check-in/check-out information.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Contact Phone
            <input
              name="contact_phone"
              type="tel"
              defaultValue={data?.contact_phone ?? ""}
              required
              minLength={10}
              maxLength={15}
              placeholder="10 to 15 digit number"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            WhatsApp Number
            <input
              name="whatsapp_number"
              type="tel"
              defaultValue={data?.whatsapp_number ?? ""}
              placeholder="Optional"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Contact Email
            <input
              name="contact_email"
              type="email"
              defaultValue={data?.contact_email ?? ""}
              placeholder="owner@example.com"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Check-in
              <input
                name="check_in_time"
                type="time"
                defaultValue={data?.check_in_time ?? ""}
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Check-out
              <input
                name="check_out_time"
                type="time"
                defaultValue={data?.check_out_time ?? ""}
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Images</h2>
          <p className="text-sm text-slate-500">
            Upload a cover image and optional gallery images.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Cover Image
              <input
                name="cover_file"
                type="file"
                accept="image/*"
                className="mt-1 block w-full rounded-xl border px-3 py-2 text-sm"
              />
            </label>

            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Current cover"
                className="mt-3 h-40 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="mt-3 flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                No current cover image
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Gallery Images
              <input
                name="gallery_files"
                type="file"
                accept="image/*"
                multiple
                className="mt-1 block w-full rounded-xl border px-3 py-2 text-sm"
              />
            </label>

            {gallery.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {gallery.map((path) => (
                  <div key={path} className="relative">
                    <img
                      src={getMediaUrl(path)}
                      alt="Gallery"
                      className="h-28 w-full rounded-xl object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setGallery((current) =>
                          current.filter((item) => item !== path),
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-semibold text-rose-700 shadow"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                No gallery images
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Amenities and Rules
          </h2>
          <p className="text-sm text-slate-500">
            Select amenities and add house rules for the property.
          </p>
        </div>

        {amenityOptions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {amenityOptions.map((amenity) => (
              <label
                key={amenity}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  name="amenities"
                  value={amenity}
                  defaultChecked={currentAmenities.includes(amenity)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {amenity}
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No amenities master data found.
          </p>
        )}

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Rules
          <textarea
            name="rules_text"
            defaultValue={currentRules.join("\n")}
            rows={5}
            placeholder={
              "One rule per line\nExample: No smoking\nExample: No loud music after 10 PM"
            }
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
          />
        </label>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Admin Controls
          </h2>
          <p className="text-sm text-slate-500">
            Mark the listing as verified or featured where required.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="is_verified"
              defaultChecked={Boolean(data?.is_verified)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Verified Property
          </label>

          <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={Boolean(data?.is_featured)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Featured Property
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Admin Notes
            <textarea
              name="admin_notes"
              defaultValue={data?.admin_notes ?? ""}
              rows={4}
              placeholder="Internal notes for admin team"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>
      </section>

      {!hasOwners ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          No approved owners are available. Please approve or create an owner
          before adding a property.
        </p>
      ) : null}

      <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-slate-50/95 py-4 backdrop-blur sm:flex-row">
        <button
          type="submit"
          disabled={!hasOwners}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isEdit ? "Update Property" : "Create Property"}
        </button>

        <Link
          href="/admin/properties"
          className="rounded-xl border bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}