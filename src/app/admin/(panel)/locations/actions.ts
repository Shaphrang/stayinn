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

const postgresUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid UUID.",
  );

const stateSchema = z.object({
  id: postgresUuidSchema.optional(),
  name: z.string().trim().min(2, "State name must be at least 2 characters."),
  is_active: z.boolean(),
});

const districtSchema = z.object({
  id: postgresUuidSchema.optional(),
  state_id: postgresUuidSchema,
  name: z
    .string()
    .trim()
    .min(2, "District name must be at least 2 characters."),
  is_active: z.boolean(),
});

const locationSchema = z.object({
  id: postgresUuidSchema.optional(),
  state_id: postgresUuidSchema,
  district_id: postgresUuidSchema,
  name: z
    .string()
    .trim()
    .min(2, "Location name must be at least 2 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens.",
    ),
  is_active: z.boolean(),
});

const idSchema = z.object({
  id: postgresUuidSchema,
});

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
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
  const returnTo = String(formData.get("return_to") ?? "/admin/locations");

  if (!returnTo.startsWith("/admin/locations")) {
    return "/admin/locations";
  }

  return returnTo;
}

async function ensureUniqueName({
  table,
  name,
  id,
  extraQuery = "",
}: {
  table: string;
  name: string;
  id?: string;
  extraQuery?: string;
}) {
  const filters = [`&name=eq.${encodeURIComponent(name)}`];

  if (extraQuery) {
    filters.push(extraQuery);
  }

  if (id) {
    filters.push(`&id=neq.${id}`);
  }

  const existing = await supabaseSelectPage<{ id: string }>(
    table,
    "id",
    filters.join(""),
    {
      from: 0,
      to: 0,
    },
  );

  if (existing.data.length > 0) {
    throw new Error("A record with the same name already exists.");
  }
}

async function ensureUniqueLocationSlug({
  slug,
  districtId,
  id,
}: {
  slug: string;
  districtId: string;
  id?: string;
}) {
  const filters = [
    `&slug=eq.${encodeURIComponent(slug)}`,
    `&district_id=eq.${districtId}`,
  ];

  if (id) {
    filters.push(`&id=neq.${id}`);
  }

  const existing = await supabaseSelectPage<{ id: string }>(
    "locations",
    "id",
    filters.join(""),
    {
      from: 0,
      to: 0,
    },
  );

  if (existing.data.length > 0) {
    throw new Error("A location with the same slug already exists in this district.");
  }
}

export async function createState(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = stateSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    is_active: parseBoolean(formData.get("is_active")),
  });

  if (!parsed.success) {
    redirectWithError("/admin/locations/states/new", getFirstZodError(parsed.error));
  }

  try {
    await ensureUniqueName({
      table: "states",
      name: parsed.data.name,
    });

    await supabaseInsert("states", {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      is_active: parsed.data.is_active,
    });
  } catch (error) {
    redirectWithError(
      "/admin/locations/states/new",
      getErrorMessage(error, "Unable to create state."),
    );
  }

  revalidatePath("/admin/locations");
  redirectWithSuccess("/admin/locations", "State created successfully.");
}

export async function updateState(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = stateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    is_active: parseBoolean(formData.get("is_active")),
  });

  if (!parsed.success || !parsed.data.id) {
    redirectWithError("/admin/locations", "Invalid state input.");
  }

  const editPath = `/admin/locations/states/${parsed.data.id}/edit`;

  try {
    await ensureUniqueName({
      table: "states",
      name: parsed.data.name,
      id: parsed.data.id,
    });

    await supabasePatch(
      "states",
      {
        name: parsed.data.name,
        is_active: parsed.data.is_active,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      editPath,
      getErrorMessage(error, "Unable to update state."),
    );
  }

  revalidatePath("/admin/locations");
  redirectWithSuccess("/admin/locations", "State updated successfully.");
}

export async function markStateInactive(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const parsed = idSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Invalid state id.");
  }

  await supabasePatch("states", { is_active: false }, `id=eq.${parsed.data.id}`);

  revalidatePath("/admin/locations");
  redirectWithSuccess(returnTo, "State marked inactive successfully.");
}

export async function createDistrict(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = districtSchema.safeParse({
    state_id: String(formData.get("state_id") ?? ""),
    name: String(formData.get("name") ?? ""),
    is_active: parseBoolean(formData.get("is_active")),
  });

  if (!parsed.success) {
    redirectWithError(
      "/admin/locations/districts/new",
      getFirstZodError(parsed.error),
    );
  }

  try {
    await ensureUniqueName({
      table: "districts",
      name: parsed.data.name,
      extraQuery: `&state_id=eq.${parsed.data.state_id}`,
    });

    await supabaseInsert("districts", {
      id: crypto.randomUUID(),
      state_id: parsed.data.state_id,
      name: parsed.data.name,
      is_active: parsed.data.is_active,
    });
  } catch (error) {
    redirectWithError(
      "/admin/locations/districts/new",
      getErrorMessage(error, "Unable to create district."),
    );
  }

  revalidatePath("/admin/locations");
  redirectWithSuccess("/admin/locations", "District created successfully.");
}

export async function updateDistrict(formData: FormData) {
  await requirePlatformAdmin();

  const parsed = districtSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    state_id: String(formData.get("state_id") ?? ""),
    name: String(formData.get("name") ?? ""),
    is_active: parseBoolean(formData.get("is_active")),
  });

  if (!parsed.success || !parsed.data.id) {
    redirectWithError("/admin/locations", "Invalid district input.");
  }

  const editPath = `/admin/locations/districts/${parsed.data.id}/edit`;

  try {
    await ensureUniqueName({
      table: "districts",
      name: parsed.data.name,
      id: parsed.data.id,
      extraQuery: `&state_id=eq.${parsed.data.state_id}`,
    });

    await supabasePatch(
      "districts",
      {
        state_id: parsed.data.state_id,
        name: parsed.data.name,
        is_active: parsed.data.is_active,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      editPath,
      getErrorMessage(error, "Unable to update district."),
    );
  }

  revalidatePath("/admin/locations");
  redirectWithSuccess("/admin/locations", "District updated successfully.");
}

export async function markDistrictInactive(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const parsed = idSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Invalid district id.");
  }

  await supabasePatch(
    "districts",
    { is_active: false },
    `id=eq.${parsed.data.id}`,
  );

  revalidatePath("/admin/locations");
  redirectWithSuccess(returnTo, "District marked inactive successfully.");
}

export async function createLocation(formData: FormData) {
  await requirePlatformAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(name);

  const parsed = locationSchema.safeParse({
    state_id: String(formData.get("state_id") ?? ""),
    district_id: String(formData.get("district_id") ?? ""),
    name,
    slug,
    is_active: parseBoolean(formData.get("is_active")),
  });

  if (!parsed.success) {
    redirectWithError(
      "/admin/locations/places/new",
      getFirstZodError(parsed.error),
    );
  }

  try {
    await ensureUniqueName({
      table: "locations",
      name: parsed.data.name,
      extraQuery: `&district_id=eq.${parsed.data.district_id}`,
    });

    await ensureUniqueLocationSlug({
      slug: parsed.data.slug,
      districtId: parsed.data.district_id,
    });

    await supabaseInsert("locations", {
      id: crypto.randomUUID(),
      state_id: parsed.data.state_id,
      district_id: parsed.data.district_id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      is_active: parsed.data.is_active,
    });
  } catch (error) {
    redirectWithError(
      "/admin/locations/places/new",
      getErrorMessage(error, "Unable to create location."),
    );
  }

  revalidatePath("/admin/locations");
  redirectWithSuccess("/admin/locations", "Location created successfully.");
}

export async function updateLocation(formData: FormData) {
  await requirePlatformAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(name);

  const parsed = locationSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    state_id: String(formData.get("state_id") ?? ""),
    district_id: String(formData.get("district_id") ?? ""),
    name,
    slug,
    is_active: parseBoolean(formData.get("is_active")),
  });

  if (!parsed.success || !parsed.data.id) {
    redirectWithError("/admin/locations", "Invalid location input.");
  }

  const editPath = `/admin/locations/places/${parsed.data.id}/edit`;

  try {
    await ensureUniqueName({
      table: "locations",
      name: parsed.data.name,
      id: parsed.data.id,
      extraQuery: `&district_id=eq.${parsed.data.district_id}`,
    });

    await ensureUniqueLocationSlug({
      slug: parsed.data.slug,
      districtId: parsed.data.district_id,
      id: parsed.data.id,
    });

    await supabasePatch(
      "locations",
      {
        state_id: parsed.data.state_id,
        district_id: parsed.data.district_id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        is_active: parsed.data.is_active,
      },
      `id=eq.${parsed.data.id}`,
    );
  } catch (error) {
    redirectWithError(
      editPath,
      getErrorMessage(error, "Unable to update location."),
    );
  }

  revalidatePath("/admin/locations");
  redirectWithSuccess("/admin/locations", "Location updated successfully.");
}

export async function markLocationInactive(formData: FormData) {
  await requirePlatformAdmin();

  const returnTo = getSafeReturnTo(formData);
  const parsed = idSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Invalid location id.");
  }

  await supabasePatch(
    "locations",
    { is_active: false },
    `id=eq.${parsed.data.id}`,
  );

  revalidatePath("/admin/locations");
  redirectWithSuccess(returnTo, "Location marked inactive successfully.");
}