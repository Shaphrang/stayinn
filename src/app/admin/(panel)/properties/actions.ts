//src\app\admin\(panel)\properties\actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  supabaseInsert,
  supabasePatch,
  supabaseSelectPage,
} from "@/lib/supabase/server";

const propertyTypeValues = [
  "homestay",
  "resort",
  "guest_house",
  "hotel",
  "cottage",
  "villa",
  "apartment",
  "camping",
  "other",
] as const;

const propertyStatusValues = [
  "draft",
  "pending_review",
  "active",
  "inactive",
  "rejected",
  "suspended",
] as const;

type PropertyStatus = (typeof propertyStatusValues)[number];

const postgresUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid UUID.",
  );

const optionalTextSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "";

  return value.trim();
}, z.string().optional().default(""));

const optionalEmailSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "";

  return value.trim().toLowerCase();
}, z.union([z.string().email("Enter a valid email address."), z.literal("")]));

const optionalPhoneSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "";

  return value.replace(/[^\d]/g, "");
}, z.union([z.string().regex(/^\d{10,15}$/, "Phone must contain 10 to 15 digits."), z.literal("")]));

const requiredPhoneSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "";

  return value.replace(/[^\d]/g, "");
}, z.string().regex(/^\d{10,15}$/, "Contact phone must contain 10 to 15 digits."));

const propertySchema = z.object({
  id: postgresUuidSchema.optional(),
  owner_id: postgresUuidSchema,
  state_id: postgresUuidSchema,
  district_id: postgresUuidSchema,
  location_id: postgresUuidSchema,

  name: z
    .string()
    .trim()
    .min(2, "Property name must be at least 2 characters."),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens.",
    ),

  property_type: z.enum(propertyTypeValues),
  short_description: optionalTextSchema,
  description: optionalTextSchema,
  address: optionalTextSchema,
  landmark: optionalTextSchema,
  pincode: optionalTextSchema,
  contact_phone: requiredPhoneSchema,
  contact_email: optionalEmailSchema,
  whatsapp_number: optionalPhoneSchema,
  cover_image: optionalTextSchema,
  gallery_images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  check_in_time: optionalTextSchema,
  check_out_time: optionalTextSchema,
  status: z.enum(propertyStatusValues),
  is_featured: z.boolean().default(false),
  is_verified: z.boolean().default(false),
  admin_notes: optionalTextSchema,
});

const statusUpdateSchema = z.object({
  id: postgresUuidSchema,
  status: z.enum(propertyStatusValues),
});

const booleanUpdateSchema = z.object({
  id: postgresUuidSchema,
  value: z.boolean(),
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function getFirstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function appendQueryMessage(
  path: string,
  key: "success" | "error",
  value: string,
) {
  const [basePath, queryString = ""] = path.split("?");
  const params = new URLSearchParams(queryString);

  params.delete("success");
  params.delete("error");
  params.set(key, value);

  return `${basePath}?${params.toString()}`;
}

function redirectWithError(path: string, message: string): never {
  redirect(appendQueryMessage(path, "error", message));
}

function redirectWithSuccess(path: string, message: string): never {
  redirect(appendQueryMessage(path, "success", message));
}

function getSafeReturnTo(formData: FormData) {
  const returnTo = String(formData.get("return_to") ?? "/admin/properties");

  if (!returnTo.startsWith("/admin/properties")) {
    return "/admin/properties";
  }

  return returnTo;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function safeJsonStringArray(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseRules(formData: FormData) {
  const jsonRules = safeJsonStringArray(formData.get("rules"));

  if (jsonRules.length > 0) {
    return jsonRules;
  }

  const text = String(formData.get("rules_text") ?? "");

  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function getRealFiles(values: FormDataEntryValue[]) {
  return values.filter((value): value is File => value instanceof File && value.size > 0);
}

function sanitizeFileName(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "image";
}

function buildPropertyPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(name);

  return propertySchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    owner_id: String(formData.get("owner_id") ?? ""),
    state_id: String(formData.get("state_id") ?? ""),
    district_id: String(formData.get("district_id") ?? ""),
    location_id: String(formData.get("location_id") ?? ""),
    name,
    slug,
    property_type: String(formData.get("property_type") ?? "homestay"),
    short_description: String(formData.get("short_description") ?? ""),
    description: String(formData.get("description") ?? ""),
    address: String(formData.get("address") ?? ""),
    landmark: String(formData.get("landmark") ?? ""),
    pincode: String(formData.get("pincode") ?? ""),
    contact_phone: String(formData.get("contact_phone") ?? ""),
    contact_email: String(formData.get("contact_email") ?? ""),
    whatsapp_number: String(formData.get("whatsapp_number") ?? ""),
    cover_image: String(formData.get("cover_image") ?? ""),
    gallery_images: safeJsonStringArray(formData.get("gallery_images")),
    amenities: formData
      .getAll("amenities")
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean),
    rules: parseRules(formData),
    check_in_time: String(formData.get("check_in_time") ?? ""),
    check_out_time: String(formData.get("check_out_time") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    is_featured: parseBoolean(formData.get("is_featured")),
    is_verified: parseBoolean(formData.get("is_verified")),
    admin_notes: String(formData.get("admin_notes") ?? ""),
  });
}

function toDbPayload(data: z.infer<typeof propertySchema>) {
  return {
    owner_id: data.owner_id,
    state_id: data.state_id,
    district_id: data.district_id,
    location_id: data.location_id,
    name: data.name,
    slug: data.slug,
    property_type: data.property_type,
    short_description: data.short_description ?? "",
    description: data.description ?? "",
    address: data.address ?? "",
    landmark: data.landmark ?? "",
    pincode: data.pincode ?? "",
    contact_phone: data.contact_phone,
    contact_email: data.contact_email ?? "",
    whatsapp_number: data.whatsapp_number ?? "",
    cover_image: data.cover_image ?? "",
    gallery_images: data.gallery_images ?? [],
    amenities: data.amenities ?? [],
    rules: data.rules ?? [],
    check_in_time: data.check_in_time ?? "",
    check_out_time: data.check_out_time ?? "",
    status: data.status,
    is_featured: data.is_featured,
    is_verified: data.is_verified,
    admin_notes: data.admin_notes ?? "",
  };
}

async function ensureUniquePropertySlug(slug: string, id?: string) {
  const filters = [`&slug=eq.${encodeURIComponent(slug)}`];

  if (id) {
    filters.push(`&id=neq.${id}`);
  }

  const existing = await supabaseSelectPage<{ id: string }>(
    "properties",
    "id",
    `${filters.join("")}`,
    {
      from: 0,
      to: 0,
    },
  );

  if (existing.data.length > 0) {
    throw new Error("A property with the same slug already exists.");
  }
}

async function uploadToStorage(path: string, file: File) {
  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!serviceRoleKey) {
    throw new Error("Supabase service role key is not configured.");
  }

  const cleanUrl = url.replace(/\/$/, "");
  const res = await fetch(`${cleanUrl}/storage/v1/object/stayinn-media/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "x-upsert": "true",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: Buffer.from(await file.arrayBuffer()),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Image upload failed. Please try again.");
  }

  return path;
}

async function uploadPropertyFile({
  propertyId,
  folder,
  file,
  path,
}: {
  propertyId: string;
  folder: "cover" | "gallery";
  file: File;
  path?: string;
}) {
  const fileName = sanitizeFileName(file.name);
  const finalPath = path || `properties/${propertyId}/${folder}/${Date.now()}-${fileName}`;

  return uploadToStorage(finalPath, file);
}

export async function createProperty(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = buildPropertyPayload(formData);

  if (!parsed.success) {
    redirectWithError("/admin/properties/new", getFirstZodError(parsed.error));
  }

  const id = crypto.randomUUID();

  try {
    await ensureUniquePropertySlug(parsed.data.slug);

    const coverFile = formData.get("cover_file");
    const galleryFiles = getRealFiles(formData.getAll("gallery_files"));

    let coverImage = parsed.data.cover_image || "";

    if (isRealFile(coverFile)) {
      coverImage = await uploadPropertyFile({
        propertyId: id,
        folder: "cover",
        file: coverFile,
      });
    }

    const uploadedGalleryImages = await Promise.all(
      galleryFiles.map((file) =>
        uploadPropertyFile({
          propertyId: id,
          folder: "gallery",
          file,
        }),
      ),
    );

    const payload = {
      id,
      ...toDbPayload({
        ...parsed.data,
        cover_image: coverImage,
        gallery_images: [
          ...(parsed.data.gallery_images ?? []),
          ...uploadedGalleryImages,
        ],
      }),
    };

    await supabaseInsert("properties", payload);
  } catch (error) {
    redirectWithError(
      "/admin/properties/new",
      getErrorMessage(error, "Unable to create property."),
    );
  }

  revalidatePath("/admin/properties");
  redirectWithSuccess(`/admin/properties/${id}`, "Property created successfully.");
}

export async function updateProperty(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = buildPropertyPayload(formData);

  if (!parsed.success || !parsed.data.id) {
    redirectWithError(
      "/admin/properties",
      parsed.success ? "Invalid property id." : getFirstZodError(parsed.error),
    );
  }

  const id = parsed.data.id;
  const editPath = `/admin/properties/${id}/edit`;

  try {
    await ensureUniquePropertySlug(parsed.data.slug, id);

    const coverFile = formData.get("cover_file");
    const galleryFiles = getRealFiles(formData.getAll("gallery_files"));

    let coverImage = parsed.data.cover_image || "";

    if (isRealFile(coverFile)) {
      coverImage = await uploadPropertyFile({
        propertyId: id,
        folder: "cover",
        file: coverFile,
      });
    }

    const uploadedGalleryImages = await Promise.all(
      galleryFiles.map((file) =>
        uploadPropertyFile({
          propertyId: id,
          folder: "gallery",
          file,
        }),
      ),
    );

    const payload = toDbPayload({
      ...parsed.data,
      cover_image: coverImage,
      gallery_images: [
        ...(parsed.data.gallery_images ?? []),
        ...uploadedGalleryImages,
      ],
    });

    await supabasePatch("properties", payload, `id=eq.${id}`);
  } catch (error) {
    redirectWithError(
      editPath,
      getErrorMessage(error, "Unable to update property."),
    );
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${id}`);
  revalidatePath(editPath);

  redirectWithSuccess(`/admin/properties/${id}`, "Property updated successfully.");
}

export async function deleteProperty(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const id = String(formData.get("id") ?? "");
  const parsed = postgresUuidSchema.safeParse(id);

  if (!parsed.success) {
    redirectWithError(returnTo, "Invalid property id.");
  }

  try {
    await supabasePatch(
      "properties",
      {
        status: "inactive",
        admin_notes: "Marked inactive by admin",
      },
      `id=eq.${id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to mark property inactive."),
    );
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${id}`);

  redirectWithSuccess(returnTo, "Property marked inactive successfully.");
}

export async function setPropertyStatus(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);

  const parsed = statusUpdateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, getFirstZodError(parsed.error));
  }

  try {
    await supabasePatch(
      "properties",
      {
        status: parsed.data.status,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to update property status."),
    );
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${parsed.data.id}`);

  redirectWithSuccess(returnTo, "Property status updated successfully.");
}

export async function approveProperty(formData: FormData) {
  formData.set("status", "active");
  return setPropertyStatus(formData);
}

export async function rejectProperty(formData: FormData) {
  formData.set("status", "rejected");
  return setPropertyStatus(formData);
}

export async function suspendProperty(formData: FormData) {
  formData.set("status", "suspended");
  return setPropertyStatus(formData);
}

export async function setPropertyInactive(formData: FormData) {
  formData.set("status", "inactive");
  return setPropertyStatus(formData);
}

export async function togglePropertyVerified(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);

  const parsed = booleanUpdateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    value: parseBoolean(formData.get("value")),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, getFirstZodError(parsed.error));
  }

  try {
    await supabasePatch(
      "properties",
      {
        is_verified: parsed.data.value,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to update verification."),
    );
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${parsed.data.id}`);

  redirectWithSuccess(returnTo, "Property verification updated successfully.");
}

export async function togglePropertyFeatured(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);

  const parsed = booleanUpdateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    value: parseBoolean(formData.get("value")),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, getFirstZodError(parsed.error));
  }

  try {
    await supabasePatch(
      "properties",
      {
        is_featured: parsed.data.value,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to update featured status."),
    );
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${parsed.data.id}`);

  redirectWithSuccess(returnTo, "Property featured status updated successfully.");
}

export async function uploadPropertyCoverImage(formData: FormData) {
  await requirePlatformAdmin();

  const propertyId = String(formData.get("propertyId") ?? "temp");
  const file = formData.get("file");
  const path = String(formData.get("path") ?? "");

  if (!isRealFile(file)) {
    return {
      ok: false,
      error: "Image is required.",
    };
  }

  try {
    const path = await uploadPropertyFile({
      propertyId,
      folder: "cover",
      file,
      path: path || undefined,
    });

    return {
      ok: true,
      path,
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Unable to upload cover image."),
    };
  }
}

export async function uploadPropertyGalleryImage(formData: FormData) {
  await requirePlatformAdmin();

  const propertyId = String(formData.get("propertyId") ?? "temp");
  const file = formData.get("file");
  const path = String(formData.get("path") ?? "");

  if (!isRealFile(file)) {
    return {
      ok: false,
      error: "Image is required.",
    };
  }

  try {
    const path = await uploadPropertyFile({
      propertyId,
      folder: "gallery",
      file,
      path: path || undefined,
    });

    return {
      ok: true,
      path,
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Unable to upload gallery image."),
    };
  }
}

export async function removePropertyGalleryImage(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "");

  const idParsed = postgresUuidSchema.safeParse(id);

  if (!idParsed.success || !path) {
    redirectWithError(returnTo, "Missing property or image path.");
  }

  const rows = await supabaseSelectPage<{ gallery_images: string[] | null }>(
    "properties",
    "gallery_images",
    `&id=eq.${id}`,
    {
      from: 0,
      to: 0,
    },
  );

  const gallery = (rows.data[0]?.gallery_images ?? []).filter(
    (item) => item !== path,
  );

  await supabasePatch(
    "properties",
    {
      gallery_images: gallery,
    },
    `id=eq.${id}`,
  );

  revalidatePath(`/admin/properties/${id}/edit`);
  revalidatePath(`/admin/properties/${id}`);

  redirectWithSuccess(returnTo, "Gallery image removed successfully.");
}
