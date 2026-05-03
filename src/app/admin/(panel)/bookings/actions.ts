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

const bookingStatusValues = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
] as const;

const paymentStatusValues = ["unpaid", "paid", "partial", "refunded"] as const;

type BookingStatus = (typeof bookingStatusValues)[number];
type PaymentStatus = (typeof paymentStatusValues)[number];

const postgresUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid UUID.",
  );

const optionalEmailSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "";

  return value.trim().toLowerCase();
}, z.union([z.string().email("Enter a valid email address."), z.literal("")]));

const phoneSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "";

  return value.replace(/[^\d]/g, "");
}, z.string().regex(/^\d{10,15}$/, "Phone must contain 10 to 15 digits."));

const amountSchema = z.preprocess((value) => {
  if (typeof value !== "string") return 0;

  const trimmed = value.trim();

  if (!trimmed) return 0;

  return Number(trimmed);
}, z.number().min(0, "Amount cannot be negative."));

const bookingSchema = z.object({
  id: postgresUuidSchema.optional(),
  guest_id: postgresUuidSchema.optional(),
  property_id: postgresUuidSchema,
  room_id: postgresUuidSchema,
  guest_full_name: z
    .string()
    .trim()
    .min(2, "Guest name must be at least 2 characters."),
  guest_phone: phoneSchema,
  guest_email: optionalEmailSchema,
  check_in_date: z.string().trim().min(1, "Check-in date is required."),
  check_out_date: z.string().trim().min(1, "Check-out date is required."),
  status: z.enum(bookingStatusValues),
  payment_status: z.enum(paymentStatusValues),
  total_amount: amountSchema,
});

const bookingStatusSchema = z.object({
  id: postgresUuidSchema,
  status: z.enum(bookingStatusValues),
});

const paymentStatusSchema = z.object({
  id: postgresUuidSchema,
  payment_status: z.enum(paymentStatusValues),
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

function redirectWithError(path: string, message: string): never {
  redirect(appendQueryMessage(path, "error", message));
}

function redirectWithSuccess(path: string, message: string): never {
  redirect(appendQueryMessage(path, "success", message));
}

function getSafeReturnTo(formData: FormData) {
  const returnTo = String(formData.get("return_to") ?? "/admin/bookings");

  if (!returnTo.startsWith("/admin/bookings")) {
    return "/admin/bookings";
  }

  return returnTo;
}

function parseBookingPayload(formData: FormData) {
  return bookingSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    guest_id: String(formData.get("guest_id") ?? "") || undefined,
    property_id: String(formData.get("property_id") ?? ""),
    room_id: String(formData.get("room_id") ?? ""),
    guest_full_name: String(formData.get("guest_full_name") ?? ""),
    guest_phone: String(formData.get("guest_phone") ?? ""),
    guest_email: String(formData.get("guest_email") ?? ""),
    check_in_date: String(formData.get("check_in_date") ?? ""),
    check_out_date: String(formData.get("check_out_date") ?? ""),
    status: String(formData.get("status") ?? "pending"),
    payment_status: String(formData.get("payment_status") ?? "unpaid"),
    total_amount: String(formData.get("total_amount") ?? "0"),
  });
}

function toDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid booking date.");
  }

  return date;
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = toDate(checkIn);
  const end = toDate(checkOut);
  const diff = end.getTime() - start.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new Error("Check-out date must be after check-in date.");
  }

  return nights;
}

function generateBookingCode() {
  const year = new Date().getFullYear();
  const suffix = `${Date.now()}`.slice(-6);

  return `BK-${year}-${suffix}`;
}

async function getRoomAndProperty(roomId: string) {
  const result = await supabaseSelectPage<{
    id: string;
    property_id: string;
    weekday_rate: number;
    weekend_rate: number;
    properties: {
      owner_id: string;
    } | null;
  }>(
    "property_rooms",
    "id,property_id,weekday_rate,weekend_rate,properties(owner_id)",
    `&id=eq.${roomId}`,
    {
      from: 0,
      to: 0,
    },
  );

  const room = result.data[0];

  if (!room) {
    throw new Error("Selected room was not found.");
  }

  const ownerId = room.properties?.owner_id;

  if (!ownerId) {
    throw new Error("Selected room property has no owner.");
  }

  return {
    id: room.id,
    property_id: room.property_id,
    weekday_rate: room.weekday_rate,
    weekend_rate: room.weekend_rate,
    owner_id: ownerId,
  };
}

async function ensureRoomAvailable({
  roomId,
  checkIn,
  checkOut,
  excludeBookingId,
}: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  excludeBookingId?: string;
}) {
  const filters = [
    `&room_id=eq.${roomId}`,
    `&check_in_date=lt.${checkOut}`,
    `&check_out_date=gt.${checkIn}`,
    `&status=not.in.(cancelled,rejected)`,
  ];

  if (excludeBookingId) {
    filters.push(`&id=neq.${excludeBookingId}`);
  }

  const existing = await supabaseSelectPage<{ id: string }>(
    "bookings",
    "id",
    filters.join(""),
    {
      from: 0,
      to: 0,
    },
  );

  if (existing.data.length > 0) {
    throw new Error("This room is already booked for the selected dates.");
  }
}

export async function createBooking(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = parseBookingPayload(formData);

  if (!parsed.success) {
    redirectWithError("/admin/bookings/new", getFirstZodError(parsed.error));
  }

  const bookingId = crypto.randomUUID();

  try {
    const nights = calculateNights(
      parsed.data.check_in_date,
      parsed.data.check_out_date,
    );

    await ensureRoomAvailable({
      roomId: parsed.data.room_id,
      checkIn: parsed.data.check_in_date,
      checkOut: parsed.data.check_out_date,
    });

    const room = await getRoomAndProperty(parsed.data.room_id);

    const guestRows = (await supabaseInsert("booking_guests", {
      full_name: parsed.data.guest_full_name,
      phone: parsed.data.guest_phone,
      email: parsed.data.guest_email || null,
    })) as { id: string }[];

    const guestId = guestRows[0]?.id;

    if (!guestId) {
      throw new Error("Unable to create guest record.");
    }

    const fallbackAmount = Number(room.weekday_rate ?? 0) * nights;
    const totalAmount =
      parsed.data.total_amount > 0 ? parsed.data.total_amount : fallbackAmount;

    await supabaseInsert("bookings", {
      id: bookingId,
      booking_code: generateBookingCode(),
      guest_id: guestId,
      property_id: room.property_id,
      room_id: parsed.data.room_id,
      owner_id: room.owner_id,
      check_in_date: parsed.data.check_in_date,
      check_out_date: parsed.data.check_out_date,
      nights,
      status: parsed.data.status,
      payment_status: parsed.data.payment_status,
      total_amount: totalAmount,
    });
  } catch (error) {
    redirectWithError(
      "/admin/bookings/new",
      getErrorMessage(error, "Unable to create booking."),
    );
  }

  revalidatePath("/admin/bookings");
  redirectWithSuccess(
    `/admin/bookings/${bookingId}`,
    "Booking created successfully.",
  );
}

export async function updateBooking(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = parseBookingPayload(formData);

  if (!parsed.success || !parsed.data.id) {
    redirectWithError(
      "/admin/bookings",
      parsed.success ? "Invalid booking id." : getFirstZodError(parsed.error),
    );
  }

  const id = parsed.data.id;
  const editPath = `/admin/bookings/${id}/edit`;

  try {
    const nights = calculateNights(
      parsed.data.check_in_date,
      parsed.data.check_out_date,
    );

    await ensureRoomAvailable({
      roomId: parsed.data.room_id,
      checkIn: parsed.data.check_in_date,
      checkOut: parsed.data.check_out_date,
      excludeBookingId: id,
    });

    const room = await getRoomAndProperty(parsed.data.room_id);

    if (parsed.data.guest_id) {
      await supabasePatch(
        "booking_guests",
        {
          full_name: parsed.data.guest_full_name,
          phone: parsed.data.guest_phone,
          email: parsed.data.guest_email || null,
        },
        `id=eq.${parsed.data.guest_id}`,
      );
    }

    const fallbackAmount = Number(room.weekday_rate ?? 0) * nights;
    const totalAmount =
      parsed.data.total_amount > 0 ? parsed.data.total_amount : fallbackAmount;

    await supabasePatch(
      "bookings",
      {
        property_id: room.property_id,
        room_id: parsed.data.room_id,
        owner_id: room.owner_id,
        check_in_date: parsed.data.check_in_date,
        check_out_date: parsed.data.check_out_date,
        nights,
        status: parsed.data.status,
        payment_status: parsed.data.payment_status,
        total_amount: totalAmount,
      },
      `id=eq.${id}`,
    );
  } catch (error) {
    redirectWithError(
      editPath,
      getErrorMessage(error, "Unable to update booking."),
    );
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath(editPath);

  redirectWithSuccess(`/admin/bookings/${id}`, "Booking updated successfully.");
}

export async function setBookingStatus(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);

  const parsed = bookingStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, getFirstZodError(parsed.error));
  }

  try {
    await supabasePatch(
      "bookings",
      {
        status: parsed.data.status,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to update booking status."),
    );
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${parsed.data.id}`);

  redirectWithSuccess(returnTo, "Booking status updated successfully.");
}

export async function setPaymentStatus(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);

  const parsed = paymentStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    payment_status: String(formData.get("payment_status") ?? ""),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, getFirstZodError(parsed.error));
  }

  try {
    await supabasePatch(
      "bookings",
      {
        payment_status: parsed.data.payment_status,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      returnTo,
      getErrorMessage(error, "Unable to update payment status."),
    );
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${parsed.data.id}`);

  redirectWithSuccess(returnTo, "Payment status updated successfully.");
}

export async function cancelBooking(formData: FormData) {
  formData.set("status", "cancelled");

  return setBookingStatus(formData);
}