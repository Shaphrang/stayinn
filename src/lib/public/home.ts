import { supabaseSelectPage } from "@/lib/supabase/server";
import { mapPropertyRowToStayCard, toPublicImageUrl } from "@/lib/public/mappers";
import type { PublicHomeData } from "@/types/public";

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const [categories, featured, latest, popularLocations, banners] = await Promise.all([
    supabaseSelectPage<{ property_type: string }>("v_public_properties", "property_type", "&order=property_type.asc", { from: 0, to: 99 }),
    supabaseSelectPage<Record<string, unknown>>("v_public_properties", "*", "&is_featured=eq.true&order=created_at.desc", { from: 0, to: 9 }),
    supabaseSelectPage<Record<string, unknown>>("v_public_properties", "*", "&order=created_at.desc", { from: 0, to: 9 }),
    supabaseSelectPage<{ id: string; location_name: string; location_slug: string; district_name: string; state_name: string }>("v_public_properties", "id,location_name,location_slug,district_name,state_name", "&order=created_at.desc", { from: 0, to: 99 }),
    supabaseSelectPage<Record<string, unknown>>("v_public_home_banners", "*", "&order=priority.asc", { from: 0, to: 4 }).catch(() => ({ data: [], count: 0 })),
  ]);
  const uniqueTypes = [...new Set(categories.data.map((x) => x.property_type).filter(Boolean))].slice(0, 12);
  const locationsMap = new Map<string, { id: string; name: string; slug: string; districtName: string; stateName: string; count: number }>();
  popularLocations.data.forEach((row) => { const key = row.location_slug; const existing = locationsMap.get(key); if (existing) existing.count += 1; else locationsMap.set(key, { id: row.id, name: row.location_name, slug: row.location_slug, districtName: row.district_name, stateName: row.state_name, count: 1 }); });
  return {
    hero: { title: "Find your perfect stay", subtitle: "Discover trusted homestays, resorts, villas and more." },
    categories: uniqueTypes.map((t) => ({ label: t, value: t })),
    banners: banners.data.map((row) => ({ id: String(row.id), title: String(row.title), subtitle: row.subtitle ? String(row.subtitle) : null, imageUrl: toPublicImageUrl((row.image_path as string | null) ?? (row.image_url as string | null)), buttonLabel: row.button_label ? String(row.button_label) : null, linkType: String(row.link_type ?? "search"), linkValue: row.link_value ? String(row.link_value) : null })),
    featuredStays: featured.data.map(mapPropertyRowToStayCard),
    weekendGetaways: latest.data.map(mapPropertyRowToStayCard),
    nearbyStays: latest.data.map(mapPropertyRowToStayCard),
    popularLocations: [...locationsMap.values()].sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
