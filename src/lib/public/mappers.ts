import { getSupabaseEnv } from "@/lib/supabase/env";
import { PUBLIC_IMAGE_FALLBACK, PUBLIC_MEDIA_BUCKET } from "@/lib/public/constants";
import type { PublicPropertyDetail, PublicRoom, PublicStayCard } from "@/types/public";

export function toPublicImageUrl(path: string | null | undefined) {
  if (!path) return PUBLIC_IMAGE_FALLBACK;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) return path;
  const { url } = getSupabaseEnv();
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${PUBLIC_MEDIA_BUCKET}/${path.replace(/^\/+/, "")}`;
}

export function mapPropertyRowToStayCard(row: Record<string, unknown>): PublicStayCard {
  const locality = String(row.location_name ?? "");
  const district = String(row.district_name ?? "");
  const state = String(row.state_name ?? "");
  const weekday = Number(row.starting_weekday_rate ?? 0);
  const weekend = Number(row.starting_weekend_rate ?? 0);
  const priceFrom = Math.max(0, weekday || weekend || 0);
  const amenities = Array.isArray(row.amenities) ? row.amenities.map(String) : [];
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.name), type: String(row.property_type),
    shortDescription: row.short_description ? String(row.short_description) : null,
    locality: locality || null, district: district || null, addressLabel: [locality, district, state].filter(Boolean).join(", "),
    priceFrom, rating: Number(row.rating_average ?? 0), reviewCount: Number(row.rating_count ?? 0),
    coverImageUrl: toPublicImageUrl(row.cover_image as string | null), tags: [...amenities.slice(0, 2), String(row.property_type), row.is_verified ? "verified" : ""].filter(Boolean),
    isFeatured: Boolean(row.is_featured), isVerified: Boolean(row.is_verified), activeRoomCount: Number(row.active_room_count ?? 0),
    latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null,
  };
}

export function mapPropertyRowToDetail(row: Record<string, unknown>): PublicPropertyDetail {
  const base = mapPropertyRowToStayCard(row);
  return {
    ...base,
    description: row.description ? String(row.description) : null,
    address: row.address ? String(row.address) : null,
    landmark: row.landmark ? String(row.landmark) : null,
    pincode: row.pincode ? String(row.pincode) : null,
    contactPhone: row.contact_phone ? String(row.contact_phone) : null,
    whatsappNumber: row.whatsapp_number ? String(row.whatsapp_number) : null,
    galleryImageUrls: Array.isArray(row.gallery_images) ? row.gallery_images.map((v) => toPublicImageUrl(String(v))) : [],
    amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : [],
    rules: Array.isArray(row.rules) ? row.rules.map(String) : [],
    checkInTime: row.check_in_time ? String(row.check_in_time) : null,
    checkOutTime: row.check_out_time ? String(row.check_out_time) : null,
    stateName: row.state_name ? String(row.state_name) : null,
    districtName: row.district_name ? String(row.district_name) : null,
    locationName: row.location_name ? String(row.location_name) : null,
  };
}

export function mapRoomRow(row: Record<string, unknown>): PublicRoom {
  return { id: String(row.id), propertyId: String(row.property_id), name: String(row.name), slug: String(row.slug), roomType: row.room_type ? String(row.room_type) : null, description: row.description ? String(row.description) : null, maxAdults: Number(row.max_adults ?? 1), maxChildren: Number(row.max_children ?? 0), maxGuests: Number(row.max_guests ?? 1), weekdayRate: Number(row.weekday_rate ?? 0), weekendRate: Number(row.weekend_rate ?? 0), seasonRate: row.season_rate === null ? null : Number(row.season_rate), holidayRate: row.holiday_rate === null ? null : Number(row.holiday_rate), childRate: row.child_rate === null ? null : Number(row.child_rate), extraBedRate: row.extra_bed_rate === null ? null : Number(row.extra_bed_rate), allowExtraBed: Boolean(row.allow_extra_bed), amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : [], coverImageUrl: toPublicImageUrl(row.cover_image as string | null), galleryImageUrls: Array.isArray(row.gallery_images) ? row.gallery_images.map((v) => toPublicImageUrl(String(v))) : [] };
}
