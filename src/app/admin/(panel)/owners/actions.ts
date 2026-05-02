"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { supabaseDelete, supabasePatch } from "@/lib/supabase/server";

const ownerUpdateSchema = z.object({
  id: z.string().uuid(),
  business_name: z.string().min(2),
  contact_person: z.string().min(2),
  phone: z.string().regex(/^\d{10,15}$/),
  email: z.string().email(),
  address: z.string().optional().default(""),
  remarks: z.string().optional().default(""),
});

const ownerStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "suspended", "pending"]),
  remarks: z.string().optional().default(""),
});

export async function updateOwnerBasicAction(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = ownerUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await supabasePatch("owner_profiles", parsed.data, `id=eq.${parsed.data.id}`);
  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${parsed.data.id}`);
  return { ok: true };
}

export async function setOwnerStatusAction(formData: FormData) {
  const { userId } = await requirePlatformAdmin();
  const parsed = ownerStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const now = new Date().toISOString();
  const payload: Record<string, string> = { status: parsed.data.status, remarks: parsed.data.remarks ?? "" };

  if (["rejected", "suspended"].includes(parsed.data.status) && !parsed.data.remarks.trim()) {
    return { ok: false, error: "Remarks are required for rejected/suspended." };
  }

  if (parsed.data.status === "approved") {
    payload.approved_at = now;
    payload.approved_by = userId;
  }
  if (parsed.data.status === "rejected") {
    payload.rejected_at = now;
    payload.rejected_by = userId;
  }
  if (parsed.data.status === "suspended") {
    payload.suspended_at = now;
    payload.suspended_by = userId;
  }

  await supabasePatch("owner_profiles", payload, `id=eq.${parsed.data.id}`);
  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${parsed.data.id}`);
  return { ok: true };
}

export async function deleteOwnerAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing owner id" };

  try {
    await supabaseDelete("owner_profiles", `id=eq.${id}`);
    revalidatePath("/admin/owners");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to delete owner. Owner may have related records." };
  }
}
