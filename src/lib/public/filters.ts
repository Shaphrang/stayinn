import { supabaseSelectPage } from "@/lib/supabase/server";
import type { PublicFilterOptions } from "@/types/public";

export async function getPublicFilters(): Promise<PublicFilterOptions> {
  const [types, states, districts, locations, amenities] = await Promise.all([
    supabaseSelectPage<{ property_type: string }>("v_public_properties", "property_type", "&order=property_type.asc", { from: 0, to: 199 }),
    supabaseSelectPage<{ id: string; name: string }>("states", "id,name", "&is_active=eq.true&order=name.asc", { from: 0, to: 199 }),
    supabaseSelectPage<{ id: string; name: string; state_id: string }>("districts", "id,name,state_id", "&is_active=eq.true&order=name.asc", { from: 0, to: 499 }),
    supabaseSelectPage<{ id: string; name: string; slug: string; district_name: string; state_name: string }>("v_public_properties", "id,location_name,location_slug,district_name,state_name", "&order=location_name.asc", { from: 0, to: 499 }),
    supabaseSelectPage<{ amenities: string[] | null }>("v_public_properties", "amenities", "", { from: 0, to: 299 }),
  ]);

  const typeCounts = new Map<string, number>();
  types.data.forEach((r) => typeCounts.set(r.property_type, (typeCounts.get(r.property_type) ?? 0) + 1));
  const amenityCounts = new Map<string, number>();
  amenities.data.forEach((r) => (r.amenities ?? []).forEach((a) => amenityCounts.set(a, (amenityCounts.get(a) ?? 0) + 1)));

  const locationSet = new Map<string, { id: string; name: string; slug: string; districtName: string; stateName: string; count: number }>();
  locations.data.forEach((r) => { const k = r.slug; const ex = locationSet.get(k); if (ex) ex.count += 1; else locationSet.set(k, { id: r.id, name: r.name, slug: r.slug, districtName: r.district_name, stateName: r.state_name, count: 1 }); });

  return {
    propertyTypes: [...typeCounts.entries()].map(([value, count]) => ({ label: value, value, count })),
    states: states.data,
    districts: districts.data.map((d) => ({ id: d.id, name: d.name, stateId: d.state_id })),
    locations: [...locationSet.values()],
    amenities: [...amenityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([value, count]) => ({ label: value, value, count })),
    priceRanges: [
      { label: "Under ₹2,000", min: 0, max: 2000 },
      { label: "₹2,000 - ₹5,000", min: 2000, max: 5000 },
      { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
      { label: "₹10,000+", min: 10000, max: null },
    ],
    guestOptions: [1, 2, 3, 4, 5, 6, 8, 10],
  };
}
