"use client";

import Link from "next/link";
import { useState } from "react";
import { optimizeImageFile } from "@/lib/media/image-optimizer";
import { getPropertyMediaBasePath, getRoomCoverPath, getRoomGalleryPath } from "@/lib/media/storage-paths";
import { uploadRoomImage } from "@/app/admin/(panel)/rooms/actions";

type RoomStatus = "active" | "inactive" | "maintenance";

type PropertyOption = {
  id: string;
  name: string;
  status: string;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
};

type RoomFormData = {
  id?: string | null;
  property_id?: string | null;
  name?: string | null;
  room_type?: string | null;
  max_guests?: number | null;
  weekday_rate?: number | null;
  weekend_rate?: number | null;
  season_rate?: number | null;
  holiday_rate?: number | null;
  cover_image?: string | null;
  gallery_images?: string[] | null;
  status?: string | null;
};

type RoomFormProps = {
  data?: RoomFormData;
  properties: PropertyOption[];
  action: (formData: FormData) => void | Promise<void>;
};

const roomStatuses: RoomStatus[] = ["active", "inactive", "maintenance"];

const roomTypes = [
  "suite",
  "premium_room",
  "deluxe_room",
  "standard_room",
  "studio",
  "cabin",
  "apartment",
  "entire_villa",
  "room",
  "other",
];

function formatRoomType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatStatus(status: RoomStatus) {
  const labels: Record<RoomStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    maintenance: "Maintenance",
  };

  return labels[status];
}

function propertyLabel(property: PropertyOption) {
  const location = [property.location_name, property.district_name]
    .filter(Boolean)
    .join(", ");

  return location ? `${property.name} (${location})` : property.name;
}

export function RoomForm({ data, properties, action }: RoomFormProps) {
  const isEdit = Boolean(data?.id);
  const [selectedType, setSelectedType] = useState(data?.room_type ?? "room");
  const hasProperties = properties.length > 0;
  const [coverImage, setCoverImage] = useState(data?.cover_image ?? "");
  const [galleryImages, setGalleryImages] = useState<string[]>(data?.gallery_images ?? []);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const selectedProperty = properties.find((p) => p.id === (data?.property_id ?? "")) ?? properties[0];
  const roomMeta = { id: data?.id ?? "temp", slug: selectedType, name: data?.name ?? "room" };
  const propertyMeta = { id: selectedProperty?.id ?? "temp", slug: selectedProperty?.name ?? "property", name: selectedProperty?.name ?? "property" };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="cover_image" value={coverImage} />
      <input type="hidden" name="gallery_images" value={JSON.stringify(galleryImages)} />
      {isEdit ? (
        <input type="hidden" name="id" value={data?.id ?? ""} />
      ) : null}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Room Details
          </h2>
          <p className="text-sm text-slate-500">
            Link this room to a property and define its type, capacity and
            status.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Property
            <select
              name="property_id"
              defaultValue={data?.property_id ?? ""}
              required
              disabled={!hasProperties}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              <option value="" disabled>
                {hasProperties ? "Select property" : "No properties available"}
              </option>

              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {propertyLabel(property)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              name="status"
              defaultValue={data?.status ?? "active"}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {roomStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Room Name
            <input
              name="name"
              defaultValue={data?.name ?? ""}
              required
              minLength={2}
              placeholder="Example: Ocean View Suite"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Room Type
            <select
              name="room_type"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {formatRoomType(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Max Guests
            <input
              name="max_guests"
              type="number"
              min={1}
              max={50}
              defaultValue={data?.max_guests ?? 2}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Images</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Cover Image
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true); setUploadError("");
              try {
                const optimized = await optimizeImageFile(file, { maxWidth: 1400, maxHeight: 900, targetMaxBytes: 300000, fallbackMaxBytes: 500000, outputType: "image/webp", qualityStart: 0.88, qualityMin: 0.7 });
                const fd = new FormData();
                fd.set("file", optimized.file);
                fd.set("path", getRoomCoverPath(propertyMeta, roomMeta));
                const result = await uploadRoomImage(fd);
                if (!result.ok || !result.path) throw new Error(result.error ?? "Upload failed");
                setCoverImage(result.path);
              } catch (err) {
                setUploadError(err instanceof Error ? err.message : "Upload failed");
              } finally { setUploading(false); }
            }} className="mt-1 block w-full rounded-xl border px-3 py-2 text-sm"/></label>
          {coverImage ? <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/stayinn-media/${coverImage}`} alt="Room cover" className="h-40 w-full rounded-xl object-cover"/> : null}
          <label className="text-sm font-medium text-slate-700">Gallery Images
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
              const files = Array.from(e.target.files ?? []).slice(0, 8);
              setUploading(true); setUploadError("");
              try {
                for (const [index, file] of files.entries()) {
                  const optimized = await optimizeImageFile(file, { maxWidth: 1200, maxHeight: 900, targetMaxBytes: 300000, fallbackMaxBytes: 500000, outputType: "image/webp", qualityStart: 0.86, qualityMin: 0.68 });
                  const fd = new FormData();
                  fd.set("file", optimized.file);
                  fd.set("path", getRoomGalleryPath(propertyMeta, roomMeta, index));
                  const result = await uploadRoomImage(fd);
                  if (!result.ok || !result.path) throw new Error(result.error ?? "Upload failed");
                  setGalleryImages((current) => [...current, result.path!].slice(0, 8));
                }
              } catch (err) {
                setUploadError(err instanceof Error ? err.message : "Upload failed");
              } finally { setUploading(false); }
            }} className="mt-1 block w-full rounded-xl border px-3 py-2 text-sm"/></label>
          <div className="grid grid-cols-2 gap-2">{galleryImages.map((path)=><div key={path} className="relative"><img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/stayinn-media/${path}`} alt="Gallery" className="h-24 w-full rounded object-cover"/><button type="button" onClick={()=>setGalleryImages((c)=>c.filter((x)=>x!==path))} className="absolute right-1 top-1 rounded bg-white px-2 text-xs">x</button></div>)}</div>
        </div>
        {uploadError ? <p className="mt-2 text-sm text-rose-700">{uploadError}</p> : null}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Pricing
          </h2>
          <p className="text-sm text-slate-500">
            Add base weekday and weekend rates. Seasonal and holiday rates are
            optional but useful for future booking logic.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            Weekday Rate
            <input
              name="weekday_rate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={data?.weekday_rate ?? ""}
              required
              placeholder="0"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Weekend Rate
            <input
              name="weekend_rate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={data?.weekend_rate ?? ""}
              required
              placeholder="0"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Season Rate
            <input
              name="season_rate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={data?.season_rate ?? 0}
              placeholder="0"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Holiday Rate
            <input
              name="holiday_rate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={data?.holiday_rate ?? 0}
              placeholder="0"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>
      </section>

      {!hasProperties ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          No properties are available. Please create or activate a property
          before adding rooms.
        </p>
      ) : null}

      <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-slate-50/95 py-4 backdrop-blur sm:flex-row">
        <button
          type="submit"
          disabled={!hasProperties || uploading}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isEdit ? "Update Room" : "Create Room"}
        </button>

        <Link
          href="/admin/rooms"
          className="rounded-xl border bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
