import { supabaseSelectPage } from "@/lib/supabase/server";
import { ALLOWED_SORTS, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/public/constants";
import { mapPropertyRowToDetail, mapPropertyRowToStayCard, mapRoomRow } from "@/lib/public/mappers";
import type { PublicPropertyDetailResponse, PublicPropertyListResponse } from "@/types/public";

function toBool(v: string | null) { return v === "true" ? true : v === "false" ? false : undefined; }
export function parsePagination(params: URLSearchParams) { const page = Math.max(1, Number(params.get("page") ?? DEFAULT_PAGE) || DEFAULT_PAGE); const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get("pageSize") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)); return { page, pageSize }; }

export async function listPublicProperties(params: URLSearchParams): Promise<PublicPropertyListResponse> {
  const { page, pageSize } = parsePagination(params);
  const offset = (page - 1) * pageSize;
  const featured = toBool(params.get("featured"));
  const verified = toBool(params.get("verified"));
  const sort = ALLOWED_SORTS.includes((params.get("sort") ?? "") as never) ? params.get("sort") : "latest";
  const chunks = [params.get("search") ? `or=(name.ilike.*${encodeURIComponent(params.get("search") as string)}*,short_description.ilike.*${encodeURIComponent(params.get("search") as string)}*)` : "", params.get("propertyType") ? `property_type=eq.${encodeURIComponent(params.get("propertyType") as string)}` : "", params.get("stateName") ? `state_name=ilike.${encodeURIComponent(params.get("stateName") as string)}` : "", params.get("districtName") ? `district_name=ilike.${encodeURIComponent(params.get("districtName") as string)}` : "", params.get("locationSlug") ? `location_slug=eq.${encodeURIComponent(params.get("locationSlug") as string)}` : "", featured !== undefined ? `is_featured=eq.${featured}` : "", verified !== undefined ? `is_verified=eq.${verified}` : ""].filter(Boolean);
  const order = sort === "price_low" ? "starting_weekday_rate.asc" : sort === "price_high" ? "starting_weekday_rate.desc" : sort === "rating" ? "rating_average.desc" : sort === "featured" ? "is_featured.desc,created_at.desc" : "created_at.desc";
  const query = `&${chunks.join("&")}${chunks.length ? "&" : ""}order=${order}`;
  const result = await supabaseSelectPage<Record<string, unknown>>("v_public_properties", "*", query, { from: offset, to: offset + pageSize - 1 });
  return { items: result.data.map(mapPropertyRowToStayCard), page, pageSize, total: result.count, hasMore: offset + pageSize < result.count };
}

export async function getPublicPropertyBySlug(slug: string): Promise<PublicPropertyDetailResponse | null> {
  const propertyRes = await supabaseSelectPage<Record<string, unknown>>("v_public_properties", "*", `&slug=eq.${encodeURIComponent(slug)}`, { from: 0, to: 0 });
  const row = propertyRes.data[0];
  if (!row) return null;
  const roomsRes = await supabaseSelectPage<Record<string, unknown>>("v_public_property_rooms", "*", `&property_id=eq.${row.id}&order=sort_order.asc,created_at.desc`, { from: 0, to: 49 });
  const similarRes = await supabaseSelectPage<Record<string, unknown>>("v_public_properties", "*", `&id=neq.${row.id}&location_slug=eq.${encodeURIComponent(String(row.location_slug ?? ""))}&property_type=eq.${encodeURIComponent(String(row.property_type ?? ""))}&order=created_at.desc`, { from: 0, to: 5 });
  return { property: mapPropertyRowToDetail(row), rooms: roomsRes.data.map(mapRoomRow), similarStays: similarRes.data.map(mapPropertyRowToStayCard) };
}
