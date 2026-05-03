"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseInsert, supabasePatch, supabaseSelect } from "@/lib/supabase/server";

const ownerStatusValues = ["pending", "approved", "rejected", "suspended"] as const;

const ownerFormSchema = z.object({
  profile_id: z.string().uuid(),
  business_name: z.string().min(2),
  contact_person: z.string().min(2),
  phone: z.string().regex(/^\d{10,15}$/),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  status: z.enum(ownerStatusValues),
});

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ownerStatusValues),
  remarks: z.string().optional().default(""),
});

async function ensureUniqueOwner(payload: { profile_id: string; phone: string; email?: string; id?: string }) {
  const filters = [`or=(profile_id.eq.${payload.profile_id},phone.eq.${payload.phone}`];
  if (payload.email) filters[0] += `,email.eq.${encodeURIComponent(payload.email)}`;
  filters[0] += ")";
  if (payload.id) filters.push(`id=neq.${payload.id}`);

  const existing = await supabaseSelect<{ id: string }>("owner_profiles", "id", `&${filters.join("&")}&limit=1`);
  if (existing.length > 0) {
    throw new Error("Owner with same profile, phone, or email already exists.");
  }
}

export async function createOwnerAction(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = ownerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await ensureUniqueOwner(parsed.data);
    await supabaseInsert("owner_profiles", {
      ...parsed.data,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to create owner." };
  }

  revalidatePath("/admin/owners");
  return { ok: true };
}

export async function updateOwnerAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = ownerFormSchema.safeParse(Object.fromEntries(formData));
  if (!id) return { ok: false, error: "Invalid owner id." };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await ensureUniqueOwner({ ...parsed.data, id });
    await supabasePatch("owner_profiles", {
      ...parsed.data,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
    }, `id=eq.${id}`);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update owner." };
  }

  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${id}`);
  return { ok: true };
}

export async function setOwnerStatusAction(formData: FormData) {
  const { userId } = await requirePlatformAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid status." };

  const now = new Date().toISOString();
  const payload: Record<string, string | null> = { status: parsed.data.status, remarks: parsed.data.remarks || "" };

  if (parsed.data.status === "approved") {
    payload.approved_at = now;
    payload.approved_by = userId;
  } else if (parsed.data.status === "rejected") {
    payload.rejected_at = now;
    payload.rejected_by = userId;
  } else if (parsed.data.status === "suspended") {
    payload.suspended_at = now;
    payload.suspended_by = userId;
  }

  await supabasePatch("owner_profiles", payload, `id=eq.${parsed.data.id}`);
  revalidatePath("/admin/owners");
  return { ok: true };
}

export async function markOwnerInactiveAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  if (!id || !profileId) return { ok: false, error: "Missing owner id." };

  await supabasePatch("owner_profiles", { status: "suspended", remarks: "Marked inactive by admin" }, `id=eq.${id}`);
  await supabasePatch("profiles", { is_active: false }, `id=eq.${profileId}`);

  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${id}`);
  return { ok: true };
}
