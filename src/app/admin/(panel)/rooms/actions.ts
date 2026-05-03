"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import {
  supabaseInsert,
  supabasePatch,
  supabaseSelectPage,
} from "@/lib/supabase/server";

const roomStatusValues = ["active", "inactive", "maintenance"] as const;

type RoomStatus = (typeof roomStatusValues)[number];

const postgresUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid UUID.",
  );

const roomIdSchema = postgresUuidSchema;

const rateSchema = z.preprocess((value) => {
  if (typeof value !== "string") return 0;

  const cleaned = value.trim();

  if (!cleaned) return 0;

  return Number(cleaned);
}, z.number().min(0, "Rate cannot be negative."));

const requiredRateSchema = z.preprocess((value) => {
  if (typeof value !== "string") return Number.NaN;

  return Number(value.trim());
}, z.number().min(0, "Rate cannot be negative."));

const roomSchema = z.object({
  id: roomIdSchema.optional(),
  property_id: postgresUuidSchema,
  name: z.string().trim().min(2, "Room name must be at least 2 characters."),
  room_type: z.string().trim().min(2, "Room type is required."),
  max_guests: z.preprocess((value) => {
    if (typeof value !== "string") return Number.NaN;

    return Number(value);
  }, z.number().int().min(1, "Max guests must be at least 1.").max(50, "Max guests is too high.")),
  weekday_rate: requiredRateSchema,
  weekend_rate: requiredRateSchema,
  season_rate: rateSchema,
  holiday_rate: rateSchema,
  status: z.enum(roomStatusValues),
});

const statusSchema = z.object({
  id: roomIdSchema,
  status: z.enum(roomStatusValues),
});

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
  const returnTo = String(formData.get("return_to") ?? "/admin/rooms");

  if (!returnTo.startsWith("/admin/rooms")) {
    return "/admin/rooms";
  }

  return returnTo;
}

function buildRoomPayload(formData: FormData) {
  return roomSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    property_id: String(formData.get("property_id") ?? ""),
    name: String(formData.get("name") ?? ""),
    room_type: String(formData.get("room_type") ?? ""),
    max_guests: String(formData.get("max_guests") ?? ""),
    weekday_rate: String(formData.get("weekday_rate") ?? ""),
    weekend_rate: String(formData.get("weekend_rate") ?? ""),
    season_rate: String(formData.get("season_rate") ?? "0"),
    holiday_rate: String(formData.get("holiday_rate") ?? "0"),
    status: String(formData.get("status") ?? "active"),
  });
}

async function ensureUniqueRoomName(payload: {
  property_id: string;
  name: string;
  id?: string;
}) {
  const filters = [
    `&property_id=eq.${payload.property_id}`,
    `&name=eq.${encodeURIComponent(payload.name)}`,
  ];

  if (payload.id) {
    filters.push(`&id=neq.${payload.id}`);
  }

  const existing = await supabaseSelectPage<{ id: string }>(
    "property_rooms",
    "id",
    filters.join(""),
    {
      from: 0,
      to: 0,
    },
  );

  if (existing.data.length > 0) {
    throw new Error("A room with this name already exists for this property.");
  }
}

export async function createRoom(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = buildRoomPayload(formData);

  if (!parsed.success) {
    redirectWithError("/admin/rooms/new", getFirstZodError(parsed.error));
  }

  const id = crypto.randomUUID();

  try {
    await ensureUniqueRoomName({
      property_id: parsed.data.property_id,
      name: parsed.data.name,
    });

    await supabaseInsert("property_rooms", {
      id,
      property_id: parsed.data.property_id,
      name: parsed.data.name,
      room_type: parsed.data.room_type,
      max_guests: parsed.data.max_guests,
      weekday_rate: parsed.data.weekday_rate,
      weekend_rate: parsed.data.weekend_rate,
      season_rate: parsed.data.season_rate,
      holiday_rate: parsed.data.holiday_rate,
      status: parsed.data.status,
    });
  } catch (error) {
    redirectWithError(
      "/admin/rooms/new",
      getErrorMessage(error, "Unable to create room."),
    );
  }

  revalidatePath("/admin/rooms");
  redirectWithSuccess(`/admin/rooms/${id}`, "Room created successfully.");
}

export async function updateRoom(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = buildRoomPayload(formData);

  if (!parsed.success || !parsed.data.id) {
    redirectWithError(
      "/admin/rooms",
      parsed.success ? "Invalid room id." : getFirstZodError(parsed.error),
    );
  }

  const id = parsed.data.id;
  const editPath = `/admin/rooms/${id}/edit`;

  try {
    await ensureUniqueRoomName({
      property_id: parsed.data.property_id,
      name: parsed.data.name,
      id,
    });

    await supabasePatch(
      "property_rooms",
      {
        property_id: parsed.data.property_id,
        name: parsed.data.name,
        room_type: parsed.data.room_type,
        max_guests: parsed.data.max_guests,
        weekday_rate: parsed.data.weekday_rate,
        weekend_rate: parsed.data.weekend_rate,
        season_rate: parsed.data.season_rate,
        holiday_rate: parsed.data.holiday_rate,
        status: parsed.data.status,
      },
      `id=eq.${id}`,
    );
  } catch (error) {
    redirectWithError(
      editPath,
      getErrorMessage(error, "Unable to update room."),
    );
  }

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${id}`);
  revalidatePath(editPath);

  redirectWithSuccess(`/admin/rooms/${id}`, "Room updated successfully.");
}

export async function setRoomStatus(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);

  const parsed = statusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, getFirstZodError(parsed.error));
  }

  try {
    await supabasePatch(
      "property_rooms",
      {
        status: parsed.data.status,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to update room status."),
    );
  }

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${parsed.data.id}`);

  redirectWithSuccess(returnTo, "Room status updated successfully.");
}

export async function markRoomInactive(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const id = String(formData.get("id") ?? "");
  const idParsed = roomIdSchema.safeParse(id);

  if (!idParsed.success) {
    redirectWithError(returnTo, "Invalid room id.");
  }

  try {
    await supabasePatch(
      "property_rooms",
      {
        status: "inactive",
      },
      `id=eq.${id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to mark room inactive."),
    );
  }

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${id}`);

  redirectWithSuccess(returnTo, "Room marked inactive successfully.");
}