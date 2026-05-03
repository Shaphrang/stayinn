export const PUBLIC_MEDIA_BUCKET = "stayinn-media";
export const PUBLIC_IMAGE_FALLBACK = "/images/stayinn-placeholder.webp";
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 30;
export const SEARCH_QUERY_MAX_LENGTH = 100;
export const ALLOWED_SORTS = ["latest", "price_low", "price_high", "rating", "featured"] as const;
export const ALLOWED_EVENT_TYPES = ["homepage_view", "category_click", "banner_click", "property_card_click", "search_submit", "property_detail_view", "phone_click", "whatsapp_click", "direction_click", "booking_start"] as const;
