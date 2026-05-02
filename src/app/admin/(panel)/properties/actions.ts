"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { supabaseDelete, supabaseInsert, supabasePatch, supabaseSelect } from "@/lib/supabase/server";

const propertySchema = z.object({
  id: z.string().uuid().optional(),
  owner_id: z.string().uuid(),
  state_id: z.string().uuid(),
  district_id: z.string().uuid(),
  location_id: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  property_type: z.enum(["homestay", "resort", "guest_house", "hotel", "cottage", "villa", "apartment", "camping", "other"]),
  short_description: z.string().optional().default(""),
  description: z.string().optional().default(""),
  address: z.string().optional().default(""),
  landmark: z.string().optional().default(""),
  pincode: z.string().optional().default(""),
  contact_phone: z.string().regex(/^\d{10,15}$/),
  contact_email: z.string().email().or(z.literal("")),
  whatsapp_number: z.string().regex(/^\d{10,15}$/).or(z.literal("")),
  cover_image: z.string().optional().default(""),
  gallery_images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  check_in_time: z.string().optional().default(""),
  check_out_time: z.string().optional().default(""),
  status: z.enum(["draft", "pending_review", "active", "inactive", "rejected", "suspended"]),
  is_featured: z.boolean(),
  is_verified: z.boolean(),
  admin_notes: z.string().optional().default(""),
});

function parseFormData(formData: FormData) {
  const obj = Object.fromEntries(formData);
  return propertySchema.safeParse({
    ...obj,
    gallery_images: JSON.parse(String(obj.gallery_images ?? "[]")),
    amenities: JSON.parse(String(obj.amenities ?? "[]")),
    rules: JSON.parse(String(obj.rules ?? "[]")),
    is_featured: obj.is_featured === "true",
    is_verified: obj.is_verified === "true",
  });
}

export async function createProperty(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = parseFormData(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid property input." };
  await supabaseInsert("properties", parsed.data);
  revalidatePath("/admin/properties");
  return { ok: true };
}

export async function updateProperty(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = parseFormData(formData);
  if (!parsed.success || !parsed.data.id) return { ok: false, error: "Invalid property input." };
  const { id, ...payload } = parsed.data;
  await supabasePatch("properties", payload, `id=eq.${id}`);
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${id}`);
  return { ok: true };
}

export async function deleteProperty(formData: FormData) { await requirePlatformAdmin(); const id = String(formData.get("id") ?? ""); if (!id) return { ok: false, error: "Missing id" }; await supabaseDelete("properties", `id=eq.${id}`); revalidatePath("/admin/properties"); return { ok: true }; }
export async function approveProperty(formData: FormData) { return setStatus(formData, "active"); }
export async function rejectProperty(formData: FormData) { return setStatus(formData, "rejected"); }
export async function suspendProperty(formData: FormData) { return setStatus(formData, "suspended"); }
export async function setPropertyInactive(formData: FormData) { return setStatus(formData, "inactive"); }
async function setStatus(formData: FormData, status: "active"|"rejected"|"suspended"|"inactive") { await requirePlatformAdmin(); const id = String(formData.get("id") ?? ""); if (!id) return { ok:false,error:"Missing id" }; await supabasePatch("properties", { status }, `id=eq.${id}`); revalidatePath("/admin/properties"); revalidatePath(`/admin/properties/${id}`); return { ok:true }; }
export async function togglePropertyVerified(formData: FormData) { await requirePlatformAdmin(); const id = String(formData.get("id") ?? ""); const v = String(formData.get("value") ?? "false") === "true"; await supabasePatch("properties", { is_verified: v }, `id=eq.${id}`); revalidatePath("/admin/properties"); return { ok: true }; }
export async function togglePropertyFeatured(formData: FormData) { await requirePlatformAdmin(); const id = String(formData.get("id") ?? ""); const v = String(formData.get("value") ?? "false") === "true"; await supabasePatch("properties", { is_featured: v }, `id=eq.${id}`); revalidatePath("/admin/properties"); return { ok: true }; }

async function uploadToStorage(path: string, file: File) {
  const { url, serviceRoleKey } = getSupabaseEnv();
  const res = await fetch(`${url}/storage/v1/object/stayinn-media/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey, "x-upsert": "true", "Content-Type": file.type || "application/octet-stream" },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error("Image upload failed. Please try again.");
  return path;
}

export async function uploadPropertyCoverImage(formData: FormData) {
  await requirePlatformAdmin();
  const propertyId = String(formData.get("propertyId") ?? "temp");
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Image is required." };
  const path = `properties/${propertyId}/cover/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  return { ok: true, path: await uploadToStorage(path, file) };
}

export async function uploadPropertyGalleryImage(formData: FormData) { await requirePlatformAdmin(); const propertyId = String(formData.get("propertyId") ?? "temp"); const file = formData.get("file"); if (!(file instanceof File)) return { ok: false, error: "Image is required." }; const path = `properties/${propertyId}/gallery/${Date.now()}-${file.name.replace(/\s+/g, "-")}`; return { ok: true, path: await uploadToStorage(path, file) }; }

export async function removePropertyGalleryImage(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "");
  if (!id || !path) return { ok: false, error: "Missing data." };
  const rows = await supabaseSelect<{ gallery_images: string[] }>("properties", "gallery_images", `&id=eq.${id}&limit=1`);
  const gallery = (rows[0]?.gallery_images ?? []).filter((p) => p !== path);
  await supabasePatch("properties", { gallery_images: gallery }, `id=eq.${id}`);
  revalidatePath(`/admin/properties/${id}/edit`);
  return { ok: true };
}
