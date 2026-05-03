"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import {
  supabaseInsert,
  supabasePatch,
  supabaseRpc,
  supabaseSelect,
} from "@/lib/supabase/server";

const ownerStatusValues = [
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;

type OwnerStatus = (typeof ownerStatusValues)[number];

const postgresUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid UUID.",
  );

const ownerIdSchema = postgresUuidSchema;

const optionalEmailSchema = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim().toLowerCase();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().email("Enter a valid email address.").optional());

const optionalTextSchema = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const ownerFormSchema = z.object({
  profile_id: postgresUuidSchema,

  business_name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters."),

  contact_person: z
    .string()
    .trim()
    .min(2, "Owner name must be at least 2 characters."),

  phone: z.preprocess(
    (value) => {
      if (typeof value !== "string") return "";

      return value.replace(/[^\d]/g, "");
    },
    z.string().regex(/^\d{10,15}$/, "Phone must contain 10 to 15 digits."),
  ),

  email: optionalEmailSchema,

  address: optionalTextSchema,

  status: z.enum(ownerStatusValues),
});

const statusSchema = z.object({
  id: ownerIdSchema,
  status: z.enum(ownerStatusValues),
  remarks: optionalTextSchema.default(""),
});

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getFirstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
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

function getSafeReturnTo(formData: FormData) {
  const returnTo = String(formData.get("return_to") ?? "/admin/owners");

  if (!returnTo.startsWith("/admin/owners")) {
    return "/admin/owners";
  }

  return returnTo;
}

function redirectWithError(path: string, message: string): never {
  redirect(appendQueryMessage(path, "error", message));
}

function redirectWithSuccess(path: string, message: string): never {
  redirect(appendQueryMessage(path, "success", message));
}

async function ensureUniqueOwner(payload: {
  profile_id: string;
  phone: string;
  email?: string;
  id?: string;
}) {
  const orFilters = [
    `profile_id.eq.${payload.profile_id}`,
    `phone.eq.${payload.phone}`,
  ];

  if (payload.email) {
    orFilters.push(`email.eq.${encodeURIComponent(payload.email)}`);
  }

  const filters = [`or=(${orFilters.join(",")})`];

  if (payload.id) {
    filters.push(`id=neq.${payload.id}`);
  }

  const existing = await supabaseSelect<{ id: string }>(
    "owner_profiles",
    "id",
    `&${filters.join("&")}&limit=1`,
  );

  if (existing.length > 0) {
    throw new Error(
      "Owner with the same profile, phone, or email already exists.",
    );
  }
}

export async function createOwnerAction(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = ownerFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWithError("/admin/owners/new", getFirstZodError(parsed.error));
  }

  try {
    await ensureUniqueOwner(parsed.data);

    await supabaseInsert("owner_profiles", {
      profile_id: parsed.data.profile_id,
      business_name: parsed.data.business_name,
      contact_person: parsed.data.contact_person,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      status: parsed.data.status,
    });
  } catch (error) {
    redirectWithError(
      "/admin/owners/new",
      getErrorMessage(error, "Unable to create owner."),
    );
  }

  revalidatePath("/admin/owners");
  redirectWithSuccess("/admin/owners", "Owner created successfully.");
}

export async function updateOwnerAction(formData: FormData) {
  await requirePlatformAdmin();

  const id = String(formData.get("id") ?? "");
  const idParsed = ownerIdSchema.safeParse(id);

  if (!idParsed.success) {
    redirectWithError("/admin/owners", "Invalid owner id.");
  }

  const editPath = `/admin/owners/${id}/edit`;
  const parsed = ownerFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWithError(editPath, getFirstZodError(parsed.error));
  }

  try {
    await ensureUniqueOwner({
      ...parsed.data,
      id,
    });

    await supabasePatch(
      "owner_profiles",
      {
        profile_id: parsed.data.profile_id,
        business_name: parsed.data.business_name,
        contact_person: parsed.data.contact_person,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        address: parsed.data.address ?? null,
        status: parsed.data.status,
      },
      `id=eq.${id}`,
    );
  } catch (error) {
    redirectWithError(
      editPath,
      getErrorMessage(error, "Unable to update owner."),
    );
  }

  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${id}`);
  revalidatePath(editPath);

  redirectWithSuccess(`/admin/owners/${id}`, "Owner updated successfully.");
}

export async function setOwnerStatusAction(formData: FormData) {
  const { userId } = await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWithError(returnTo, getFirstZodError(parsed.error));
  }

  const now = new Date().toISOString();
  const status: OwnerStatus = parsed.data.status;

  const payload: Record<string, string | null> = {
    status,
    remarks: parsed.data.remarks || null,
  };

  if (status === "approved") {
    payload.approved_at = now;
    payload.approved_by = userId;
    payload.rejected_at = null;
    payload.rejected_by = null;
    payload.suspended_at = null;
    payload.suspended_by = null;
  }

  if (status === "rejected") {
    payload.rejected_at = now;
    payload.rejected_by = userId;
    payload.approved_at = null;
    payload.approved_by = null;
    payload.suspended_at = null;
    payload.suspended_by = null;
  }

  if (status === "suspended") {
    payload.suspended_at = now;
    payload.suspended_by = userId;
    payload.approved_at = null;
    payload.approved_by = null;
    payload.rejected_at = null;
    payload.rejected_by = null;
  }

  if (status === "pending") {
    payload.approved_at = null;
    payload.approved_by = null;
    payload.rejected_at = null;
    payload.rejected_by = null;
    payload.suspended_at = null;
    payload.suspended_by = null;
  }

  try {
    await supabasePatch("owner_profiles", payload, `id=eq.${parsed.data.id}`);
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to update owner status."),
    );
  }

  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${parsed.data.id}`);

  redirectWithSuccess(returnTo, "Owner status updated successfully.");
}

export async function markOwnerInactiveAction(formData: FormData) {
  const { userId } = await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const id = String(formData.get("id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");

  const idParsed = ownerIdSchema.safeParse(id);
  const profileIdParsed = postgresUuidSchema.safeParse(profileId);

  if (!idParsed.success || !profileIdParsed.success) {
    redirectWithError(returnTo, "Missing or invalid owner id.");
  }

  try {
    await supabaseRpc("admin_mark_owner_inactive", {
      p_owner_id: id,
      p_profile_id: profileId,
      p_admin_id: userId,
    });
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to mark owner inactive."),
    );
  }

  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${id}`);

  redirectWithSuccess(returnTo, "Owner marked inactive successfully.");
}