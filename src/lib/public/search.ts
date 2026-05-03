import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/public/constants";
import { listPublicProperties, parsePagination } from "@/lib/public/properties";
import type { PublicSearchResponse } from "@/types/public";

export async function searchPublicProperties(params: URLSearchParams): Promise<PublicSearchResponse> {
  const q = params.get("q")?.trim();
  const where = params.get("where")?.trim();
  if (q && q.length > SEARCH_QUERY_MAX_LENGTH) throw new Error("INVALID_QUERY_PARAMS");
  if (where && where.length > SEARCH_QUERY_MAX_LENGTH) throw new Error("INVALID_QUERY_PARAMS");

  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  if ((checkIn && Number.isNaN(Date.parse(checkIn))) || (checkOut && Number.isNaN(Date.parse(checkOut)))) throw new Error("INVALID_QUERY_PARAMS");

  const guestsValue = params.get("guests");
  if (guestsValue) {
    const guests = Number(guestsValue);
    if (!Number.isFinite(guests) || guests < 1 || guests > 20) throw new Error("INVALID_QUERY_PARAMS");
  }

  if (q) params.set("search", q);
  if (where && !params.get("locationSlug")) params.set("locationSlug", where.toLowerCase().replace(/\s+/g, "-"));

  const base = await listPublicProperties(params);
  const { page, pageSize } = parsePagination(params);
  return { ...base, page, pageSize, appliedFilters: { q: q ?? null, where: where ?? null, checkIn: checkIn ?? null, checkOut: checkOut ?? null, guests: guestsValue ? Number(guestsValue) : null, propertyType: params.get("propertyType") ?? null, locationSlug: params.get("locationSlug") ?? null } };
}
