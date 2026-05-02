"use client";

import { useMemo, useState } from "react";

type Master = {
  id: string;
  name: string;
  state_id?: string;
  district_id?: string;
};

type Option = {
  id: string;
  name: string;
};

type PropertyData = {
  id?: string;
  name?: string;
  slug?: string;
  owner_id?: string;
  property_type?: string;
  state_id?: string;
  district_id?: string;
  location_id?: string;
  contact_phone?: string;
  contact_email?: string;
  whatsapp_number?: string;
  check_in_time?: string;
  check_out_time?: string;
  pincode?: string;
  status?: string;
  short_description?: string;
  description?: string;
  address?: string;
  landmark?: string;
  admin_notes?: string;
  amenities?: string[];
  rules?: string[];
  gallery_images?: string[];
  cover_image?: string;
  is_featured?: boolean;
  is_verified?: boolean;
};

type UploadResult = {
  ok: boolean;
  path?: string;
  message?: string;
};

type Props = {
  data?: PropertyData;
  owners: Option[];
  states: Option[];
  districts: Master[];
  locations: Master[];
  amenitiesMaster: string[];
  action: (fd: FormData) => void | Promise<void>;
  uploadCover: (fd: FormData) => Promise<UploadResult>;
  uploadGallery: (fd: FormData) => Promise<UploadResult>;
};

const DEFAULT_PROPERTY_AMENITIES = [
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

const PROPERTY_TYPES = [
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

const PROPERTY_STATUSES = [
  "draft",
  "pending_review",
  "active",
  "inactive",
  "rejected",
  "suspended",
];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function PropertyForm({
  data,
  owners,
  states,
  districts,
  locations,
  amenitiesMaster,
  action,
  uploadCover,
  uploadGallery,
}: Props) {
  const [name, setName] = useState(data?.name ?? "");
  const [slug, setSlug] = useState(data?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(data?.slug));

  const [amenities, setAmenities] = useState<string[]>(data?.amenities ?? []);
  const [rules, setRules] = useState<string[]>(
    data?.rules?.length ? data.rules : [""],
  );

  const [gallery, setGallery] = useState<string[]>(data?.gallery_images ?? []);
  const [cover, setCover] = useState(data?.cover_image ?? "");

  const [stateId, setStateId] = useState(data?.state_id ?? "");
  const [districtId, setDistrictId] = useState(data?.district_id ?? "");
  const [locationId, setLocationId] = useState(data?.location_id ?? "");

  const amenityOptions = useMemo(() => {
    return amenitiesMaster?.length ? amenitiesMaster : DEFAULT_PROPERTY_AMENITIES;
  }, [amenitiesMaster]);

  const filteredDistricts = useMemo(() => {
    return districts.filter((district) => {
      return !stateId || district.state_id === stateId;
    });
  }, [districts, stateId]);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      return !districtId || location.district_id === districtId;
    });
  }, [locations, districtId]);

  function handleNameChange(value: string) {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function toggleAmenity(amenity: string) {
    setAmenities((current) => {
      if (current.includes(amenity)) {
        return current.filter((item) => item !== amenity);
      }

      return [...current, amenity];
    });
  }

  function updateRule(index: number, value: string) {
    setRules((current) => {
      return current.map((rule, ruleIndex) => {
        return ruleIndex === index ? value : rule;
      });
    });
  }

  function removeRule(index: number) {
    setRules((current) => {
      const next = current.filter((_, ruleIndex) => ruleIndex !== index);
      return next.length ? next : [""];
    });
  }

  function addRule() {
    setRules((current) => [...current, ""]);
  }

  async function onCoverFile(file: File) {
    const fd = new FormData();

    fd.append("propertyId", data?.id ?? "temp");
    fd.append("file", file);

    const result = await uploadCover(fd);

    if (result?.ok && result.path) {
      setCover(result.path);
    }
  }

  async function onGalleryFile(file: File) {
    const fd = new FormData();

    fd.append("propertyId", data?.id ?? "temp");
    fd.append("file", file);

    const result = await uploadGallery(fd);

    if (result?.ok && result.path) {
      setGallery((current) => [...current, result.path as string]);
    }
  }

  function removeGalleryImage(path: string) {
    setGallery((current) => current.filter((item) => item !== path));
  }

  return (
    <form action={action} className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm">
      {data?.id ? <input type="hidden" name="id" value={data.id} /> : null}

      <input type="hidden" name="cover_image" value={cover} />
      <input type="hidden" name="gallery_images" value={JSON.stringify(gallery)} />
      <input type="hidden" name="amenities" value={JSON.stringify(amenities)} />
      <input
        type="hidden"
        name="rules"
        value={JSON.stringify(rules.map((rule) => rule.trim()).filter(Boolean))}
      />

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Property Details</h2>
        <p className="text-sm text-slate-500">
          Add the main stay information, owner, location, contact and approval status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Property Name</label>
          <input
            required
            name="name"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Property name"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Slug</label>
          <input
            required
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="property-slug"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Owner</label>
          <select
            required
            name="owner_id"
            defaultValue={data?.owner_id ?? ""}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select owner</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Property Type</label>
          <select
            name="property_type"
            defaultValue={data?.property_type ?? "homestay"}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">State</label>
          <select
            required
            name="state_id"
            value={stateId}
            onChange={(event) => {
              setStateId(event.target.value);
              setDistrictId("");
              setLocationId("");
            }}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select state</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">District</label>
          <select
            required
            name="district_id"
            value={districtId}
            onChange={(event) => {
              setDistrictId(event.target.value);
              setLocationId("");
            }}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select district</option>
            {filteredDistricts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Location</label>
          <select
            required
            name="location_id"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select location</option>
            {filteredLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Contact Phone</label>
          <input
            required
            name="contact_phone"
            defaultValue={data?.contact_phone ?? ""}
            placeholder="10 to 15 digit phone number"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Contact Email</label>
          <input
            name="contact_email"
            type="email"
            defaultValue={data?.contact_email ?? ""}
            placeholder="owner@example.com"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">WhatsApp Number</label>
          <input
            name="whatsapp_number"
            defaultValue={data?.whatsapp_number ?? ""}
            placeholder="WhatsApp number"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Check-in Time</label>
          <input
            name="check_in_time"
            defaultValue={data?.check_in_time ?? "12:00"}
            type="time"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Check-out Time</label>
          <input
            name="check_out_time"
            defaultValue={data?.check_out_time ?? "11:00"}
            type="time"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Pincode</label>
          <input
            name="pincode"
            defaultValue={data?.pincode ?? ""}
            placeholder="Pincode"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            defaultValue={data?.status ?? "draft"}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          name="short_description"
          defaultValue={data?.short_description ?? ""}
          placeholder="Short description"
          className="min-h-24 w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <textarea
          name="description"
          defaultValue={data?.description ?? ""}
          placeholder="Full description"
          className="min-h-32 w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <input
          required
          name="address"
          defaultValue={data?.address ?? ""}
          placeholder="Full address"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <input
          name="landmark"
          defaultValue={data?.landmark ?? ""}
          placeholder="Nearby landmark"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <textarea
          name="admin_notes"
          defaultValue={data?.admin_notes ?? ""}
          placeholder="Admin notes"
          className="min-h-24 w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="mb-3 font-medium text-slate-900">Amenities</p>

        {amenityOptions.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {amenityOptions.map((amenity) => (
              <label
                key={amenity}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {amenity}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No amenities found.</p>
        )}
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium text-slate-900">Rules</p>
          <button
            type="button"
            onClick={addRule}
            className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Add Rule
          </button>
        </div>

        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={rule}
                onChange={(event) => updateRule(index, event.target.value)}
                placeholder="Example: Valid ID required"
                className="flex-1 rounded-lg border bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <button
                type="button"
                onClick={() => removeRule(index)}
                className="rounded-lg border bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="mb-3 font-medium text-slate-900">Cover Image</p>

        {cover ? (
          <div className="mb-3 flex items-center gap-3">
            <img
              src={cover}
              className="h-24 w-32 rounded-lg border object-cover"
              alt="Property cover"
            />

            <button
              type="button"
              onClick={() => setCover("")}
              className="rounded-lg border bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ) : null}

        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onCoverFile(file);
          }}
        />
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="mb-3 font-medium text-slate-900">Gallery Images</p>

        {gallery.length ? (
          <div className="mb-3 flex flex-wrap gap-3">
            {gallery.map((path) => (
              <div key={path} className="relative">
                <img
                  src={path}
                  className="h-24 w-24 rounded-lg border object-cover"
                  alt="Property gallery"
                />

                <button
                  type="button"
                  onClick={() => removeGalleryImage(path)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onGalleryFile(file);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="is_featured"
            value="true"
            defaultChecked={Boolean(data?.is_featured)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Featured
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="is_verified"
            value="true"
            defaultChecked={Boolean(data?.is_verified)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Verified
        </label>
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-indigo-700 px-5 py-2.5 font-medium text-white hover:bg-indigo-800">
          Save Property
        </button>
      </div>
    </form>
  );
}